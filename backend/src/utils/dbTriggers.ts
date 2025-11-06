import { SEED, COEFFICIENTS } from './seedGenerator';
import pool from '../config/db';

/**
 * Creates a database function and trigger to calculate the priority score
 * when a new waitlist entry is added or updated.
 */
export async function createPriorityScoreTrigger() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Check if the waitlist table exists
    const tableExists = await client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'waitlist'
      )`
    );

    if (!tableExists.rows[0].exists) {
      console.log('Waitlist table does not exist yet, skipping trigger creation');
      await client.query('COMMIT');
      return;
    }

    // Create or replace the function with better validation
    await client.query(`
      CREATE OR REPLACE FUNCTION calculate_priority_score()
      RETURNS TRIGGER AS $$
      DECLARE
        base_score INT := 1000; -- Base score can be adjusted
        calculated_score INT;
      BEGIN
        -- Validate input values
        NEW.signup_latency_ms := COALESCE(NEW.signup_latency_ms, 0);
        NEW.account_age_days := COALESCE(NEW.account_age_days, 0);
        NEW.rapid_actions := COALESCE(NEW.rapid_actions, 0);
        
        -- Ensure non-negative values
        NEW.signup_latency_ms := GREATEST(0, NEW.signup_latency_ms);
        NEW.account_age_days := GREATEST(0, NEW.account_age_days);
        NEW.rapid_actions := GREATEST(0, NEW.rapid_actions);
        
        -- Calculate the priority score using the formula:
        -- base + (signup_latency_ms % A) + (account_age_days % B) - (rapid_actions % C)
        calculated_score := 
          base_score +
          (NEW.signup_latency_ms % ${COEFFICIENTS.A}) +
          (NEW.account_age_days % ${COEFFICIENTS.B}) -
          (NEW.rapid_actions % ${COEFFICIENTS.C});
          
        -- Ensure the score is non-negative
        NEW.priority_score := GREATEST(0, calculated_score);
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Drop the trigger if it exists
    await client.query(`
      DROP TRIGGER IF EXISTS update_priority_score ON waitlist;
    `);

    // Create the trigger
    await client.query(`
      CREATE TRIGGER update_priority_score
      BEFORE INSERT OR UPDATE ON waitlist
      FOR EACH ROW
      EXECUTE FUNCTION calculate_priority_score();
    `);

    await client.query('COMMIT');
    console.log('Priority score trigger created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating priority score trigger:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Drops the priority score trigger and function
 */
export async function dropPriorityScoreTrigger() {
  try {
    await pool.query('DROP TRIGGER IF EXISTS update_priority_score ON waitlist;');
    await pool.query('DROP FUNCTION IF EXISTS calculate_priority_score();');
    console.log('Priority score trigger dropped successfully');
  } catch (error) {
    console.error('Error dropping priority score trigger:', error);
    throw error;
  }
}

// Create the trigger when this module is imported
createPriorityScoreTrigger().catch(console.error);
