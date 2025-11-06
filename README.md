# DropSpot - Priority-Based Waitlist System

## Seed-Based Priority Scoring System

### Overview
The priority scoring system ensures fair and deterministic ordering of users in the waitlist. It uses a combination of factors to calculate a priority score for each user when they join the waitlist.

### Seed Generation
A unique seed is generated for each project using the following components:
1. Git remote URL: `git config --get remote.origin.url`
2. First commit timestamp: `git log --reverse --format=%ct | head -n1`
3. Project start timestamp: `YYYYMMDDHHmm` format

These components are combined as: `<remote_url>|<first_commit_epoch>|<start_time>`
and hashed using SHA-256. The first 12 characters of the hash are used as the seed.

### Coefficients
Three coefficients (A, B, C) are derived from the seed:
- `A = 7 + (seed[0:2] % 5)`
- `B = 13 + (seed[2:4] % 7)`
- `C = 3 + (seed[4:6] % 3)`

These coefficients ensure the priority score calculation is unique to each project.

### Priority Score Formula
```
priority_score = base_score +
                (signup_latency_ms % A) +
                (account_age_days % B) -
                (rapid_actions % C)
```

Where:
- `base_score`: Starting score (default: 1000)
- `signup_latency_ms`: Time between account creation and waitlist join (milliseconds)
- `account_age_days`: Account age in days
- `rapid_actions`: Number of waitlist joins in the last hour
- `A, B, C`: Project-specific coefficients

### Implementation Details

#### Database Schema
- `waitlist` table includes:
  - `priority_score`: Calculated score (higher is better)
  - `signup_latency_ms`: Time from account creation to waitlist join (ms)
  - `account_age_days`: Account age in days
  - `rapid_actions`: Number of recent waitlist joins

#### Key Components
1. **Seed Generation** (`src/utils/seedGenerator.ts`)
   - Generates and caches the project seed
   - Calculates coefficients A, B, C
   - Provides functions to calculate priority scores

2. **Database Trigger** (`src/utils/dbTriggers.ts`)
   - Automatically calculates priority score on insert/update
   - Ensures consistent scoring logic in the database

3. **Waitlist Management** (`src/modules/drops/drops.service.ts`)
   - Tracks user metrics for scoring
   - Handles concurrent access with transactions
   - Enforces fair claim order

### Usage

#### Joining Waitlist
When a user joins a waitlist:
1. System records signup latency and account age
2. Updates rapid action counter
3. Calculates and stores priority score

#### Claiming Drops
When claiming a drop:
1. System selects the user with the highest priority score
2. Ties are broken by join time (earlier join wins)
3. User is removed from waitlist after successful claim

### Example
```typescript
// Example seed and coefficients
const SEED = "a1b2c3d4e5f6";
const COEFFICIENTS = {
  A: 9,  // 7 + (0xa1 % 5) = 7 + 2 = 9
  B: 15, // 13 + (0xb2 % 7) = 13 + 2 = 15
  C: 4   // 3 + (0xc3 % 3) = 3 + 1 = 4
};

// Example calculation
const baseScore = 1000;
const signupLatencyMs = 3600000; // 1 hour
const accountAgeDays = 30;
const rapidActions = 2;

const score = baseScore + 
             (signupLatencyMs % COEFFICIENTS.A) + 
             (accountAgeDays % COEFFICIENTS.B) - 
             (rapidActions % COEFFICIENTS.C);
// score = 1000 + (3600000 % 9) + (30 % 15) - (2 % 4)
//       = 1000 + 0 + 0 - 2
//       = 998
```

### Notes
- The system is designed to be fair and resistant to gaming
- Scores are calculated deterministically based on the project seed
- All calculations are done in the database for consistency
- The seed and coefficients are logged during application startup
