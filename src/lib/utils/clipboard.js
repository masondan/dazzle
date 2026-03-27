/**
 * Copy text to clipboard
 * @param {string} text
 * @returns {Promise<boolean>}
 */
export async function copyToClipboard(text) {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (error) {
		console.error('Clipboard copy failed:', error);
		return false;
	}
}

/**
 * Format order for rider/delivery (address, phone, name)
 * @param {string} name
 * @param {string} phone
 * @param {string} address
 * @returns {string}
 */
export function formatForRider(name, phone, address) {
	return `${name}\n${phone}\n${address}`;
}
