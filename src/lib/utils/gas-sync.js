/**
 * Post data to Google Apps Script via hidden form + iframe.
 * Form submissions bypass CORS entirely — the most reliable
 * way to send data to GAS web apps from a browser.
 *
 * @param {string} url - GAS deployment URL
 * @param {object} payload - Data to send
 * @returns {Promise<void>}
 */
export function postToGAS(url, payload) {
	return new Promise((resolve) => {
		const id = 'gas_' + Date.now();

		const iframe = document.createElement('iframe');
		iframe.name = id;
		iframe.style.display = 'none';
		document.body.appendChild(iframe);

		const form = document.createElement('form');
		form.method = 'POST';
		form.action = url;
		form.target = id;
		form.style.display = 'none';

		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = 'payload';
		input.value = JSON.stringify(payload);
		form.appendChild(input);

		document.body.appendChild(form);
		form.submit();

		// Clean up after GAS has time to process
		setTimeout(() => {
			form.remove();
			iframe.remove();
			resolve();
		}, 5000);
	});
}

/**
 * Sync data to Google Sheet via GAS.
 * @param {'inventory' | 'orders'} type
 * @param {Array} data
 */
export async function syncToSheet(type, data) {
	const gasUrl = localStorage.getItem('dazzle_gas_url');
	if (!gasUrl) {
		console.warn('No GAS URL configured. Set via: localStorage.setItem("dazzle_gas_url", "YOUR_URL")');
		return;
	}

	console.log(`Syncing ${type} to sheet:`, data.length, 'items');

	try {
		await postToGAS(gasUrl, { type, data });
		console.log(`${type} sync request sent`);
	} catch (error) {
		console.error(`${type} sync failed:`, error);
	}
}
