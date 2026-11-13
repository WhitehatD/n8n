import type {
	ICredentialsDecrypted,
	ICredentialTestFunctions,
	INodeCredentialTestResult,
} from 'n8n-workflow';

import { getGoogleAccessToken } from '../../../GenericFunctions';

export async function googleApiCredentialTest(
	this: ICredentialTestFunctions,
	credential: ICredentialsDecrypted,
): Promise<INodeCredentialTestResult> {
	try {
		// The credential test validates the private key, not the Domain-Wide
		// Delegation setup. Remove the delegated email so that the token request
		// uses the service account itself as the subject. This avoids requiring
		// admin-consented scopes, which vary per use case and would cause
		// `unauthorized_client` when the test's hardcoded scopes (sheetV2) are
		// not authorized in the Google Workspace admin console.
		const testData = { ...credential.data!, delegatedEmail: undefined };
		const tokenRequest = await getGoogleAccessToken.call(this, testData, 'sheetV2');
		if (!tokenRequest.access_token) {
			return {
				status: 'Error',
				message: 'Could not generate a token from your private key.',
			};
		}
	} catch (err) {
		return {
			status: 'Error',
			message: `Private key validation failed: ${err.message}`,
		};
	}

	return {
		status: 'OK',
		message: 'Connection successful!',
	};
}
