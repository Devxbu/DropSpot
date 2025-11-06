import createUserTable from "../modules/auth/auth.model";
import {createDropsTable, createWaitlistTable, migrateWaitlistTable} from "../modules/drops/drops.model";
import {createClaimTable, createClaimWindowTable} from "../modules/claim/claim.model";
import { createPriorityScoreTrigger } from "./dbTriggers";

// Helper function to safely execute database operations with retries
const executeWithRetry = async (operation: () => Promise<void>, operationName: string, maxRetries = 3, delay = 500) => {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            await operation();
            console.log(`${operationName} completed successfully`);
            return; // Success, exit the function
        } catch (error) {
            lastError = error as Error;
            console.warn(`Attempt ${attempt} of ${operationName} failed:`, error);
            
            if (attempt < maxRetries) {
                console.log(`Retrying ${operationName} in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    
    // If we get here, all retries failed
    throw new Error(`Failed to execute ${operationName} after ${maxRetries} attempts: ${lastError?.message}`);
};

export default async function createTables() {
    try {
        // First create all tables
        console.log('Creating database tables...');
        await executeWithRetry(createUserTable, 'createUserTable');
        await executeWithRetry(createDropsTable, 'createDropsTable');
        await executeWithRetry(createWaitlistTable, 'createWaitlistTable');
        await executeWithRetry(createClaimTable, 'createClaimTable');
        await executeWithRetry(createClaimWindowTable, 'createClaimWindowTable');
        
        // Then run migrations
        console.log('Running migrations...');
        await executeWithRetry(migrateWaitlistTable, 'migrateWaitlistTable');
        
        // Finally, create triggers that depend on the tables
        console.log('Creating database triggers...');
        await executeWithRetry(createPriorityScoreTrigger, 'createPriorityScoreTrigger');
        
        console.log('All database setup completed successfully');
    } catch (error) {
        console.error('Error setting up database:', error);
        throw error;
    }
}