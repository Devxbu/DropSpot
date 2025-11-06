import createUserTable from "../modules/auth/auth.model";
import {createDropsTable, createWaitlistTable} from "../modules/drops/drops.model";
import {createClaimTable, createClaimWindowTable} from "../modules/claim/claim.model";

export default async function createTables() {
    await createUserTable();
    await createDropsTable();
    await createWaitlistTable();
    await createClaimTable();
    await createClaimWindowTable();
}