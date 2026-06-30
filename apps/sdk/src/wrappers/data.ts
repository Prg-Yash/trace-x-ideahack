import { DataApi } from "../generated/src/apis/DataApi";
import { FraudApi } from "../generated/src/apis/FraudApi";
import { Account } from "../generated/src/models/Account";
import { Transaction } from "../generated/src/models/Transaction";
import { getAuthenticatedConfig } from "../auth/interceptor";
import { validateRequiredString } from "../utils/validators";

/**
 * Creates a new account in the system.
 *
 * @param account The account details to create
 */
export async function createAccount(account: Account): Promise<any> {
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.createAccountApiV1AccountsPost({
        account,
    });
}

/**
 * Retrieve account details by ID.
 *
 * @param accountId The account identifier
 */
export async function getAccount(accountId: string): Promise<any> {
    const validAccountId = validateRequiredString(accountId, "accountId");
    const config = getAuthenticatedConfig();
    const api = new DataApi(config);
    return await api.getAccountApiV1AccountsAccountIdGet({
        accountId: validAccountId,
    });
}

/**
 * Get a paginated list of all accounts.
 *
 * @param skip Number of items to skip for pagination (default: 0)
 * @param limit Maximum number of items to return (default: 100)
 * @param branchCode Optional branch code filter
 */
export async function getAllAccounts(skip?: number, limit?: number, branchCode?: string): Promise<any> {
    const config = getAuthenticatedConfig();
    const api = new DataApi(config);
    return await api.getAllAccountsApiV1AccountsGet({
        skip,
        limit,
        branchCode,
    });
}

/**
 * Creates a new transaction in the system (this triggers live ML evaluation).
 *
 * @param transaction The transaction details to create
 */
export async function createTransaction(transaction: Transaction): Promise<any> {
    const config = getAuthenticatedConfig();
    const api = new FraudApi(config);
    return await api.createTransactionApiV1TransactionsPost({
        transaction,
    });
}

/**
 * Retrieve a transaction by ID.
 *
 * @param txnId The transaction identifier
 */
export async function getTransaction(txnId: string): Promise<any> {
    const validTxnId = validateRequiredString(txnId, "txnId");
    const config = getAuthenticatedConfig();
    const api = new DataApi(config);
    return await api.getTransactionApiV1TransactionsTxnIdGet({
        txnId: validTxnId,
    });
}

/**
 * Get a paginated list of all transactions.
 *
 * @param skip Number of items to skip for pagination (default: 0)
 * @param limit Maximum number of items to return (default: 100)
 */
export async function getAllTransactions(skip?: number, limit?: number): Promise<any> {
    const config = getAuthenticatedConfig();
    const api = new DataApi(config);
    return await api.getAllTransactionsApiV1TransactionsGet({
        skip,
        limit,
    });
}

/**
 * Add a note to an account's history.
 *
 * @param accountId The account identifier
 * @param content The text content of the note
 * @param author Optional author name (defaults to "FINnet Investigator")
 */
export async function addAccountNote(accountId: string, content: string, author?: string): Promise<any> {
    const validAccountId = validateRequiredString(accountId, "accountId");
    const validContent = validateRequiredString(content, "content");
    const config = getAuthenticatedConfig();
    const api = new DataApi(config);
    return await api.addAccountNoteApiV1AccountsAccountIdNotesPost({
        accountId: validAccountId,
        noteCreate: {
            content: validContent,
            author: author || "FINnet Investigator",
        },
    });
}

/**
 * Get all notes associated with a specific account.
 *
 * @param accountId The account identifier
 */
export async function getAccountNotes(accountId: string): Promise<any> {
    const validAccountId = validateRequiredString(accountId, "accountId");
    const config = getAuthenticatedConfig();
    const api = new DataApi(config);
    return await api.getAccountNotesApiV1AccountsAccountIdNotesGet({
        accountId: validAccountId,
    });
}
