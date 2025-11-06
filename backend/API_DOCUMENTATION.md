# Dropspot API Documentation

## Table of Contents
- [Authentication](#authentication)
- [Drops](#drops)
- [Claims](#claims)
- [Admin](#admin)
- [Types](#types)

## Authentication

### Register
- **Endpoint**: `POST /auth/signup`
- **Request Body**:
  ```typescript
  interface RegisterRequest {
    email: string;
    password: string;
    username: string;
    name: string;
  }
  ```
- **Response**:
  ```typescript
  interface RegisterResponse {
    message: string;
    user: User;
  }
  ```

### Login
- **Endpoint**: `POST /auth/login`
- **Request Body**:
  ```typescript
  interface LoginRequest {
    email: string;
    password: string;
  }
  ```
- **Response**:
  ```typescript
  interface LoginResponse {
    accessToken: string;
    refreshToken: string;
  }
  ```

### Logout
- **Endpoint**: `POST /auth/logout`
- **Request Body**:
  ```typescript
  interface LogoutRequest {
    refreshToken: string;
  }
  ```
- **Response**:
  ```typescript
  interface LogoutResponse {
    message: string;
  }
  ```

### Refresh Token
- **Endpoint**: `POST /auth/refresh`
- **Request Body**:
  ```typescript
  interface RefreshTokenRequest {
    refreshToken: string;
  }
  ```
- **Response**:
  ```typescript
  interface RefreshTokenResponse {
    accessToken: string;
  }
  ```

### Get Profile
- **Endpoint**: `GET /auth/me`
- **Headers**: `Authorization: Bearer <access_token>`
- **Response**: `User`

## Drops

### Get All Drops
- **Endpoint**: `GET /drops`
- **Response**: `Drop[]`

### Get Drop by ID
- **Endpoint**: `GET /drops/:id`
- **Response**: `Drop`

### Add to Waitlist
- **Endpoint**: `POST /drops/:id/waitlist`
- **Response**: `Drop`

### Remove from Waitlist
- **Endpoint**: `DELETE /drops/:id/waitlist`
- **Response**: `Drop`

### Claim Drop
- **Endpoint**: `POST /drops/:id/claim`
- **Response**: `Claim`

### Get My Drops
- **Endpoint**: `GET /drops/my`
- **Response**: `Drop[]`

## Claims

### Get Claim
- **Endpoint**: `GET /claim/:id`
- **Response**: `Claim`

### Create Claim
- **Endpoint**: `POST /claim/:id/claim`
- **Request Body**:
  ```typescript
  interface CreateClaimRequest {
    dropId: string;
  }
  ```
- **Response**: `Claim`

### Redeem Claim
- **Endpoint**: `PATCH /claim/:id/redeem`
- **Response**: `Claim`

## Admin

### User Management

#### Get All Users
- **Endpoint**: `GET /admin/users`
- **Response**: `User[]`

#### Get User by ID
- **Endpoint**: `GET /admin/users/:id`
- **Response**: `User`

#### Delete User
- **Endpoint**: `DELETE /admin/users/:id`
- **Response**: `{ success: boolean }`

#### Update User
- **Endpoint**: `PUT /admin/users/:id`
- **Request Body**: `Partial<User>`
- **Response**: `User`

### Drops Management

#### Create Drop
- **Endpoint**: `POST /admin/drops`
- **Request Body**: `Omit<Drop, 'id' | 'createdAt' | 'updatedAt'>`
- **Response**: `Drop`

#### Get All Drops (Admin)
- **Endpoint**: `GET /admin/drops`
- **Response**: `Drop[]`

#### Get Drop by ID (Admin)
- **Endpoint**: `GET /admin/drops/:id`
- **Response**: `Drop`

#### Update Drop
- **Endpoint**: `PUT /admin/drops/:id`
- **Request Body**: `Partial<Drop>`
- **Response**: `Drop`

#### Delete Drop
- **Endpoint**: `DELETE /admin/drops/:id`
- **Response**: `{ success: boolean }`

### Waitlist Management

#### Get Drop Waitlist
- **Endpoint**: `GET /admin/drops/:id/waitlist`
- **Response**: `User[]`

#### Create Claim Window
- **Endpoint**: `POST /admin/drops/:id/claim-window`
- **Response**: `{ success: boolean }`

#### Assign Claim
- **Endpoint**: `POST /admin/drops/:id/assign-claim`
- **Response**: `Claim`

#### Get Drop Claims
- **Endpoint**: `GET /admin/drops/:id/claims`
- **Response**: `Claim[]`

### Claims Management

#### Get All Claims
- **Endpoint**: `GET /admin/claims`
- **Response**: `Claim[]`

#### Delete Claim
- **Endpoint**: `DELETE /admin/claims/:claimId`
- **Response**: `{ success: boolean }`

## Types

```typescript
interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

interface Drop {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  totalSupply: number;
  availableSupply: number;
  price: number;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  waitlist: string[]; // Array of user IDs
  claims: string[];    // Array of claim IDs
  createdAt: Date;
  updatedAt: Date;
}

interface Claim {
  id: string;
  userId: string;
  dropId: string;
  status: 'pending' | 'assigned' | 'redeemed' | 'expired';
  code: string;
  assignedAt: Date;
  redeemedAt: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## Error Responses

All error responses follow this format:
```typescript
interface ErrorResponse {
  error: string;
  message?: string;
  details?: any;
}
```

### Common Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error
