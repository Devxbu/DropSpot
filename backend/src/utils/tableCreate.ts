import createUserTable from "../modules/auth/auth.model";

export default async function createTables() {
    await createUserTable();
}