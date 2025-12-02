import * as fs from 'fs';
import * as path from 'path';
import { URL } from 'url';

/**
 * Uploads a file to a storage location and makes it public.
 *
 * @param sourceFilePath - Local path of the file to upload.
 * @param destinationBlobName - Name of the blob in the storage.
 * @returns Public URL of the uploaded file.
 */
export function uploadFileToCdn(
	sourceFilePath: string,
	destinationBlobName: string
): string {
	const base = process.env.CDN_BASEURL || '';
	const folder = process.env.CDN_FOLDER || '';

	// Create a blob and upload the file
	const dest = path.join(folder, destinationBlobName);
	const destDir = path.dirname(dest);

	// Create directory if it doesn't exist
	fs.mkdirSync(destDir, { recursive: true });

	// Copy the file
	fs.copyFileSync(sourceFilePath, dest);

	// Return the public URL
	return new URL(destinationBlobName, base).toString();
}

/**
 * Deletes a file from the storage location using its public URL.
 *
 * @param publicUrl - Public URL of the file to remove.
 */
export function deleteFileFromCdn(publicUrl: string): void {
	const base = process.env.CDN_BASEURL || '';
	const folder = process.env.CDN_FOLDER || '';

	// Extract the file path relative to the CDN base URL
	const relativePath = publicUrl.replace(base, '').replace(/^\//, '');
	const dest = path.join(folder, relativePath);

	// Check if the file exists and remove it
	if (fs.existsSync(dest)) {
		fs.unlinkSync(dest);
	}
}
/**
 * Attempts to decode a Base64 encoded string.
 * If the input string is successfully decoded as Base64, the decoded string is returned.
 * If the input string is not Base64 encoded, the original string is returned.
 *
 * @param str - The string to attempt to decode from Base64.
 * @returns The decoded string if successful, otherwise the original string.
 */
export function tryDecodeBase64(str: string): string {
    try {
        // Basic format check
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        if (!base64Regex.test(str) || str.length % 4 !== 0) {
            console.log("Not valid Base64 format, returning original");
            return str;
        }
        
        const decoded = atob(str);
        
        // Round-trip test
        const reencoded = btoa(decoded);
        if (reencoded !== str) {
            console.log("Round-trip failed, returning original");
            return str;
        }
        
        // Optional: Check if decoded content looks reasonable
        // (contains mostly printable characters)
        const printableRatio = decoded.split('').filter(char => {
            const code = char.charCodeAt(0);
            return code >= 32 && code <= 126; // Printable ASCII range
        }).length / decoded.length;
        
        if (printableRatio < 0.7 && decoded.length > 10) {
            console.log("Decoded content appears to be binary/garbage, returning original");
            return str;
        }
        
        console.log("Decoded successfully with validation");
        return decoded;
    } catch (e) {
        console.log("Decode failed, returning original");
        return str;
    }
}