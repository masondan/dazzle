<script>
	let { order, total } = $props();

	function formatDate(dateStr) {
		if (!dateStr) return '';
		let d;
		if (dateStr.includes('-')) {
			d = new Date(dateStr + 'T00:00:00');
		} else {
			const parts = dateStr.split('/');
			if (parts.length === 3) d = new Date(parts[2], parts[1] - 1, parts[0]);
			else return dateStr;
		}
		return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}
</script>

<div class="receipt">
	<!-- Header -->
	<div class="receipt-header">
		<img src="/logos/logo-dazzle-logotype.png" alt="Dazzle by Dorah" class="receipt-logo" />
		<div class="receipt-title">Receipt</div>
	</div>

	<!-- Order info -->
	<div class="receipt-section">
		<div>Date: {formatDate(order.date)}</div>
		<div>Order ID: {order.id}</div>
	</div>

	<!-- Customer info -->
	<div class="receipt-section">
		<div>Customer: {order.customerName}</div>
		{#if order.addresses.length > 0}
			<div>Address: {order.addresses[0].address}</div>
		{/if}
		<div>Phone: {order.customerPhone}</div>
	</div>

	<!-- Items block -->
	<div class="receipt-items">
		{#each order.items as item}
			<div class="receipt-item-line">
				<span>{item.name} × {item.qty}</span>
				<span>₦{(item.salePrice * item.qty).toLocaleString()}</span>
			</div>
		{/each}
		<div class="receipt-item-line receipt-total-line">
			<span>Total</span>
			<span>₦{total.toLocaleString()}</span>
		</div>
	</div>

	<!-- Payment method -->
	<div class="receipt-section">
		<div>Payment method: {order.paymentMethod || 'Bank transfer'}</div>
	</div>

	<!-- Thank you message -->
	<div class="receipt-message">
		Thank you for shopping with Dazzle. We hope you enjoy your purchase and we look forward to serving you again.
	</div>
	<div class="receipt-signoff">Dorah and Team Dazzle</div>

	<!-- Returns policy -->
	<div class="receipt-returns">
		Returns: We want you to love your purchase. If you have any issues, please contact us immediately.
		Agreed returns must reach us within 14 days of delivery. Items must be undamaged and returned in original packaging.
	</div>

	<!-- Footer -->
	<div class="receipt-footer">
		<div class="receipt-footer-brand">DazzleByDorah</div>
		<div class="receipt-footer-contact">dazzlebydorah@gmail.com</div>
		<div class="receipt-footer-contact">WhatsApp: +234 703 182 1027</div>
	</div>
</div>

<style>
	.receipt {
		width: 380px;
		padding: 32px 24px;
		background: white;
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
		color: #333333;
	}

	.receipt-header {
		text-align: center;
		margin-bottom: 24px;
	}

	.receipt-logo {
		width: 160px;
		margin: 0 auto 8px;
		display: block;
	}

	.receipt-title {
		font-size: 18px;
		font-weight: 600;
		color: #333333;
	}

	.receipt-section {
		margin-bottom: 16px;
		font-size: 14px;
		line-height: 1.6;
	}

	/* Items block — matches order card appearance */
	.receipt-items {
		background: #f9f9f9;
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 16px;
	}

	.receipt-item-line {
		display: flex;
		justify-content: space-between;
		padding: 6px 10px;
		font-size: 14px;
	}

	.receipt-total-line {
		border-top: 1px solid #e5e5e5;
		font-weight: 700;
		font-size: 16px;
		padding: 8px 10px;
		background: #f0f0f0;
	}

	.receipt-message {
		font-size: 13px;
		color: #555555;
		line-height: 1.5;
		margin-bottom: 4px;
	}

	.receipt-signoff {
		font-size: 13px;
		color: #AA0171;
		font-weight: 600;
		text-align: right;
		margin-bottom: 20px;
	}

	.receipt-returns {
		font-size: 12px;
		color: #777777;
		line-height: 1.5;
		margin-bottom: 24px;
	}

	.receipt-footer {
		text-align: center;
		font-size: 13px;
		line-height: 1.6;
	}

	.receipt-footer-brand {
		font-weight: 600;
		color: #AA0171;
	}

	.receipt-footer-contact {
		color: #777777;
	}
</style>
