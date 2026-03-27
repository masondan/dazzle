import html2canvas from 'html2canvas';

/**
 * Generate a receipt PNG from order data
 * @param {HTMLElement} element - The receipt template element
 * @returns {Promise<Blob>}
 */
export async function generateReceiptImage(element) {
	const canvas = await html2canvas(element, {
		useCORS: true,
		allowTaint: true,
		scale: 2,
		backgroundColor: '#ffffff'
	});

	return new Promise(resolve => {
		canvas.toBlob(blob => {
			resolve(blob);
		}, 'image/png');
	});
}

/**
 * Share receipt via Web Share API (opens native share dialog)
 * @param {Blob} blob - The receipt image
 * @param {string} orderId - Order ID for filename
 */
export async function shareReceipt(blob, orderId) {
	const file = new File([blob], `receipt-${orderId}.png`, { type: 'image/png' });

	if (navigator.share) {
		try {
			await navigator.share({
				files: [file],
				title: `Order Receipt - ${orderId}`,
				text: 'Here is your order receipt'
			});
		} catch (error) {
			if (error.name !== 'AbortError') {
				console.error('Share failed:', error);
			}
		}
	} else {
		console.warn('Web Share API not supported');
		// Fallback: download instead
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `receipt-${orderId}.png`;
		a.click();
		URL.revokeObjectURL(url);
	}
}
