<script>
	import { ordersStore } from '$lib/stores/orders.svelte.js';
	import { copyToClipboard, formatForRider } from '$lib/utils/clipboard.js';
	import { generateReceiptImage, shareReceipt } from '$lib/utils/receipt.js';
	import OrderForm from './OrderForm.svelte';
	import ReceiptTemplate from './ReceiptTemplate.svelte';

	let showForm = $state(false);
	let editingOrder = $state(null);
	let expandedOrderId = $state(null);
	let statusFilter = $state('all');
	let toastMessage = $state('');
	let deleteConfirmId = $state(null);
	let receiptOrder = $state(null);
	let receiptEl = $state(null);

	function showToast(msg) {
		toastMessage = msg;
		setTimeout(() => { toastMessage = ''; }, 2500);
	}

	const statusSteps = ['lead', 'customer', 'processing', 'completed'];
	const statusIcons = {
		lead: '/icons/icon-leads-fill.svg',
		customer: '/icons/icon-orders-fill.svg',
		processing: '/icons/icon-processing-fill.svg',
		completed: '/icons/icon-complete-fill.svg'
	};

	let filtered = $derived(
		statusFilter === 'all'
			? ordersStore.orders
			: ordersStore.orders.filter(o => o.status === statusFilter)
	);

	let statusCounts = $derived.by(() => {
		const counts = { all: ordersStore.orders.length };
		for (const step of statusSteps) {
			counts[step] = ordersStore.orders.filter(o => o.status === step).length;
		}
		return counts;
	});

	function handleAddOrder(orderData) {
		ordersStore.addOrder(orderData);
		ordersStore.sync();
		showForm = false;
		editingOrder = null;
		showToast(orderData.status === 'lead' ? 'Lead saved' : 'Order saved');
	}

	function handleEditOrder(order) {
		editingOrder = { ...order, items: order.items.map(i => ({ ...i })), addresses: order.addresses.map(a => ({ ...a })) };
		showForm = true;
	}

	function handleUpdateOrder(orderData) {
		ordersStore.updateOrder(editingOrder.id, {
			customerName: orderData.customerName,
			customerPhone: orderData.customerPhone,
			addresses: orderData.addresses,
			source: orderData.source,
			notes: orderData.notes,
			items: orderData.items,
			date: orderData.date,
			status: orderData.status,
			paymentMethod: orderData.paymentMethod
		});
		ordersStore.sync();
		showForm = false;
		editingOrder = null;
		showToast(orderData.status === 'lead' ? 'Lead saved' : 'Order saved');
	}

	function handleCancel() {
		showForm = false;
		editingOrder = null;
	}

	function toggleExpand(id) {
		expandedOrderId = expandedOrderId === id ? null : id;
	}

	function advanceStatus(order) {
		const currentIdx = statusSteps.indexOf(order.status);
		if (currentIdx < statusSteps.length - 1) {
			ordersStore.updateOrderStatus(order.id, statusSteps[currentIdx + 1]);
			ordersStore.sync();
		}
	}

	function revertStatus(order) {
		const currentIdx = statusSteps.indexOf(order.status);
		if (currentIdx > 0) {
			ordersStore.updateOrderStatus(order.id, statusSteps[currentIdx - 1]);
			ordersStore.sync();
		}
	}

	function confirmDelete(id) {
		deleteConfirmId = id;
	}

	function cancelDelete() {
		deleteConfirmId = null;
	}

	function executeDelete() {
		if (deleteConfirmId) {
			ordersStore.deleteOrder(deleteConfirmId);
			ordersStore.deleteFromRemote(deleteConfirmId);
			if (expandedOrderId === deleteConfirmId) expandedOrderId = null;
			deleteConfirmId = null;
		}
	}

	function updateNotes(order, value) {
		ordersStore.updateOrder(order.id, { notes: value });
		ordersStore.sync();
	}

	async function copyRiderInfo(order) {
		const addr = order.addresses.length > 0
			? order.addresses.map(a => `${a.type}: ${a.address}`).join('\n')
			: 'No address';
		const text = formatForRider(order.customerName, order.customerPhone, addr);
		const ok = await copyToClipboard(text);
		if (ok) showToast('Copied to clipboard');
	}

	function handleReceipt(order) {
		receiptOrder = order;
	}

	function closeReceipt() {
		receiptOrder = null;
	}

	async function getReceiptBlob() {
		if (!receiptEl) return null;
		try {
			return await generateReceiptImage(receiptEl);
		} catch (e) {
			console.error('Receipt generation failed:', e);
			showToast('Receipt failed');
			return null;
		}
	}

	async function handleReceiptCopy() {
		const blob = await getReceiptBlob();
		if (!blob) return;
		try {
			await navigator.clipboard.write([
				new ClipboardItem({ 'image/png': blob })
			]);
			showToast('Copied');
		} catch (e) {
			console.error('Clipboard copy failed:', e);
			showToast('Copy failed');
		}
	}

	async function handleReceiptShare() {
		const blob = await getReceiptBlob();
		if (!blob) return;
		await shareReceipt(blob, receiptOrder.id);
	}

	async function handleReceiptDownload() {
		const blob = await getReceiptBlob();
		if (!blob) return;
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `receipt-${receiptOrder.id}.png`;
		a.click();
		URL.revokeObjectURL(url);
	}

	function calculateTotal(order) {
		return ordersStore.calculateOrderTotal(order);
	}

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

	function autoGrow(e) {
		e.target.style.height = 'auto';
		e.target.style.height = e.target.scrollHeight + 'px';
	}
</script>

<div class="customers-container">
	<button class="btn-new" onclick={() => { editingOrder = null; showForm = true; }}>
		+ New order | lead
	</button>

	<div class="status-pills">
		<button class="pill" class:active={statusFilter === 'all'} onclick={() => (statusFilter = 'all')}>
			All
			<span class="pill-count">{statusCounts.all}</span>
		</button>
		{#each statusSteps as step}
			<button class="pill" class:active={statusFilter === step} onclick={() => (statusFilter = step)}>
				<img src={statusIcons[step]} alt="" class="pill-icon" />
				<span class="pill-count">{statusCounts[step]}</span>
			</button>
		{/each}
	</div>

	{#if showForm}
		<OrderForm
			onsubmit={editingOrder ? handleUpdateOrder : handleAddOrder}
			oncancel={handleCancel}
			editOrder={editingOrder}
		/>
	{/if}

	<div class="orders-list">
		{#if filtered.length === 0}
			<p class="empty-state">
				{#if statusFilter === 'all'}
					No orders yet. Create your first one!
				{:else}
					No items in this status
				{/if}
			</p>
		{:else}
			{#each filtered as order (order.id)}
				<div class="order-card" class:expanded={expandedOrderId === order.id}>
					<!-- Card top: name + meta + expand -->
					<button class="card-header" onclick={() => toggleExpand(order.id)}>
						<div class="header-content">
							<div class="name-row">
								<span class="label-h">Name</span>
								<span class="customer-name">{order.customerName}</span>
							</div>
							<div class="meta-row">
								<span class="meta-pair"><span class="ml">ID</span> <span class="mv">{order.id}</span></span>
								<span class="meta-sep">|</span>
								<span class="meta-pair"><span class="ml">Date</span> <span class="mv">{formatDate(order.date)}</span></span>
								<span class="meta-sep">|</span>
								<span class="meta-pair"><span class="ml">Total</span> <span class="mv">₦{calculateTotal(order).toLocaleString()}</span></span>
							</div>
						</div>
						<img
							src={expandedOrderId === order.id ? '/icons/icon-collapse.svg' : '/icons/icon-expand.svg'}
							alt=""
							class="expand-icon"
							width="20"
							height="20"
						/>
					</button>

					<!-- Status progress bar — always visible -->
					<div class="status-bar">
						{#each statusSteps as step, idx}
							<img
								src={statusIcons[step]}
								alt=""
								class="sb-icon"
								class:active={statusSteps.indexOf(order.status) >= idx}
							/>
							{#if idx < statusSteps.length - 1}
								<div class="sb-line" class:active={statusSteps.indexOf(order.status) > idx}></div>
							{/if}
						{/each}
					</div>

					<!-- Expanded detail -->
					{#if expandedOrderId === order.id}
						<div class="order-detail">
							<!-- Back/Next buttons first -->
							<div class="status-buttons">
								{#if statusSteps.indexOf(order.status) > 0}
									<button class="btn-status-back" onclick={() => revertStatus(order)}>← Back</button>
								{/if}
								{#if statusSteps.indexOf(order.status) < statusSteps.length - 1}
									<button class="btn-status-next" onclick={() => advanceStatus(order)}>Next →</button>
								{/if}
							</div>

							<div class="detail-section">
								<span class="detail-label">Phone</span>
								<a href="tel:{order.customerPhone}" class="phone-link">{order.customerPhone}</a>
							</div>

							{#if order.addresses.length > 0}
								<div class="detail-section">
									<span class="detail-label">Address</span>
									{#each order.addresses as addr}
										<span class="address-line">{addr.type}: {addr.address}</span>
									{/each}
								</div>
							{/if}

							{#if order.source}
								<div class="detail-section">
									<span class="detail-label">Source</span>
									<span>{order.source}</span>
								</div>
							{/if}

							<div class="detail-section">
								<span class="detail-label">Items</span>
								<div class="items-list">
									{#each order.items as item}
										<div class="item-line">
											<span>{item.name} × {item.qty}</span>
											<span>₦{(item.salePrice * item.qty).toLocaleString()}</span>
										</div>
									{/each}
									<div class="item-line total-line">
										<span>Total</span>
										<span>₦{calculateTotal(order).toLocaleString()}</span>
									</div>
								</div>
							</div>

							{#if order.paymentMethod}
								<div class="detail-section">
									<span class="detail-label">Payment method</span>
									<span>{order.paymentMethod}</span>
								</div>
							{/if}

							<!-- Notes — always visible -->
							<div class="detail-section no-border">
								<span class="detail-label">Notes</span>
								<textarea
									class="notes-input"
									value={order.notes || ''}
									onblur={(e) => updateNotes(order, e.target.value)}
									oninput={autoGrow}
									rows="2"
								></textarea>
							</div>

							<!-- Actions: Receipt + icon buttons -->
							<div class="order-actions">
								<button
									class="btn-receipt"
									class:disabled={order.status === 'lead'}
									onclick={() => order.status !== 'lead' && handleReceipt(order)}
								>
									<img src="/icons/icon-share.svg" alt="" width="16" height="16" />
									Receipt
								</button>
								<button class="btn-icon-action" onclick={() => handleEditOrder(order)}>
									<img src="/icons/icon-edit.svg" alt="" width="18" height="18" />
								</button>
								<button class="btn-icon-action" onclick={() => copyRiderInfo(order)}>
									<img src="/icons/icon-copy.svg" alt="" width="18" height="18" />
								</button>
								<button class="btn-icon-action btn-icon-danger" onclick={() => confirmDelete(order.id)}>
									<img src="/icons/icon-trash.svg" alt="" width="18" height="18" />
								</button>
							</div>
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	</div>
</div>

<!-- Delete confirmation modal -->
{#if deleteConfirmId}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={cancelDelete}>
		<div class="modal-card" onclick={(e) => e.stopPropagation()}>
			<p class="modal-message">Delete order?</p>
			<div class="modal-actions">
				<button class="btn-modal-cancel" onclick={cancelDelete}>Cancel</button>
				<button class="btn-modal-delete" onclick={executeDelete}>Delete</button>
			</div>
		</div>
	</div>
{/if}

{#if receiptOrder}
	<div class="receipt-drawer">
		<div class="receipt-drawer-header">
			<button class="receipt-drawer-close" onclick={closeReceipt}>
				<img src="/icons/icon-close.svg" alt="Close" width="20" height="20" />
			</button>
			<div class="receipt-drawer-actions">
				<button class="receipt-action-btn" onclick={handleReceiptCopy}>
					<img src="/icons/icon-copy.svg" alt="Copy" width="20" height="20" />
				</button>
				<button class="receipt-action-btn" onclick={handleReceiptShare}>
					<img src="/icons/icon-share.svg" alt="Share" width="20" height="20" />
				</button>
				<button class="receipt-action-btn" onclick={handleReceiptDownload}>
					<img src="/icons/icon-download.svg" alt="Download" width="20" height="20" />
				</button>
			</div>
		</div>
		<div class="receipt-drawer-sep"></div>
		<div class="receipt-drawer-body">
			<div bind:this={receiptEl}>
				<ReceiptTemplate order={receiptOrder} total={calculateTotal(receiptOrder)} />
			</div>
		</div>
	</div>
{/if}

{#if toastMessage}
	<div class="toast">{toastMessage}</div>
{/if}

<style>
	.customers-container {
		padding: 16px;
	}

	.btn-new {
		width: 100%;
		background: var(--dazzle);
		color: white;
		border: none;
		padding: 12px 16px;
		border-radius: 8px;
		font-weight: 600;
		font-size: var(--font-body);
		cursor: pointer;
		transition: background 0.2s;
		margin-bottom: 12px;
	}

	.btn-new:active {
		background: #7a0054;
	}

	/* Status pills */
	.status-pills {
		display: flex;
		gap: 4px;
		margin-bottom: 16px;
	}

	.pill {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		padding: 8px 4px;
		border: 1px solid #ddd;
		background: white;
		border-radius: 8px;
		cursor: pointer;
		font-size: 12px;
		font-weight: 600;
		color: var(--text-helper);
		transition: all 0.2s;
	}

	.pill.active {
		background: var(--dazzle);
		color: white;
		border-color: var(--dazzle);
	}

	.pill-icon {
		width: 18px;
		height: 18px;
		opacity: 0.5;
	}

	.pill.active .pill-icon {
		opacity: 1;
		filter: brightness(0) invert(1);
	}

	.pill-count {
		font-size: 12px;
	}

	/* Orders list */
	.orders-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.empty-state {
		text-align: center;
		color: var(--text-helper);
		padding: 40px 20px;
		font-size: var(--font-helper);
	}

	/* Order card */
	.order-card {
		background: white;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.order-card.expanded {
		border-color: var(--dazzle);
		box-shadow: 0 2px 8px rgba(170, 1, 113, 0.1);
	}

	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		padding: 12px;
		border: none;
		background: none;
		cursor: pointer;
		text-align: left;
		gap: 8px;
	}

	.header-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
	}

	.name-row {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.label-h {
		font-size: var(--font-helper);
		color: var(--text-helper);
	}

	.customer-name {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-body);
	}

	.meta-row {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
	}

	.meta-pair {
		display: inline-flex;
		gap: 4px;
	}

	.ml {
		color: var(--text-helper);
	}

	.mv {
		color: var(--text-body);
		font-weight: 500;
	}

	.meta-sep {
		color: #ddd;
	}

	.expand-icon {
		opacity: 0.4;
		flex-shrink: 0;
	}

	/* Status progress bar — no circle backgrounds */
	.status-bar {
		display: flex;
		align-items: center;
		padding: 10px 16px;
		gap: 0;
	}

	.sb-icon {
		width: 26px;
		height: 26px;
		flex-shrink: 0;
		opacity: 0.25;
		filter: brightness(0) saturate(100%) invert(11%) sepia(73%) saturate(6610%) hue-rotate(322deg) brightness(87%) contrast(107%);
	}

	.sb-icon.active {
		opacity: 1;
	}

	.sb-line {
		flex: 1;
		height: 6px;
		border-radius: 3px;
		background: #f8d3ea;
		margin: 0 4px;
	}

	.sb-line.active {
		background: var(--dazzle);
	}

	/* Expanded detail */
	.order-detail {
		padding: 0 12px 12px;
	}

	/* Status buttons — first in expanded area */
	.status-buttons {
		display: flex;
		gap: 8px;
		padding: 10px 0;
	}

	.btn-status-back,
	.btn-status-next {
		flex: 1;
		padding: 8px;
		border: none;
		border-radius: 6px;
		font-size: var(--font-helper);
		font-weight: 600;
		cursor: pointer;
	}

	.btn-status-back {
		background: #f0f0f0;
		color: #666;
	}

	.btn-status-next {
		background: var(--dazzle);
		color: white;
	}

	.detail-section {
		padding: 10px 0;
		border-bottom: 1px solid #f5f5f5;
		font-size: var(--font-body);
		color: var(--text-body);
	}

	.detail-section:last-of-type,
	.detail-section.no-border {
		border-bottom: none;
	}

	.detail-label {
		display: block;
		font-size: var(--font-helper);
		font-weight: 600;
		color: var(--text-helper);
		margin-bottom: 4px;
	}

	.phone-link {
		color: var(--text-body);
		text-decoration: none;
	}

	.address-line {
		display: block;
		font-size: var(--font-body);
		line-height: 1.4;
	}

	.items-list {
		background: #f9f9f9;
		border-radius: 6px;
		overflow: hidden;
	}

	.item-line {
		display: flex;
		justify-content: space-between;
		padding: 6px 10px;
		font-size: var(--font-helper);
	}

	.total-line {
		border-top: 1px solid #e5e5e5;
		font-weight: 700;
		font-size: var(--font-body);
		padding: 8px 10px;
		background: #f0f0f0;
	}

	/* Notes input — always visible */
	.notes-input {
		width: 100%;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: var(--font-body);
		font-family: inherit;
		color: var(--text-body);
		resize: none;
		overflow: hidden;
		min-height: 42px;
		line-height: 1.4;
	}

	/* Actions row */
	.order-actions {
		display: flex;
		gap: 8px;
		padding-top: 12px;
		align-items: center;
	}

	.btn-receipt {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 10px;
		border: none;
		background: var(--dazzle);
		color: white;
		border-radius: 6px;
		cursor: pointer;
		font-size: var(--font-helper);
		font-weight: 600;
	}

	.btn-receipt.disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.btn-receipt img {
		filter: brightness(0) invert(1);
	}

	.btn-icon-action {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 1px solid #ddd;
		background: white;
		border-radius: 6px;
		cursor: pointer;
		flex-shrink: 0;
	}

	.btn-icon-action img {
		opacity: 0.5;
	}

	.btn-icon-action:hover img {
		opacity: 1;
	}

	.btn-icon-danger {
		border-color: #ffcdd2;
	}

	.btn-icon-danger:hover {
		background: #ffebee;
	}

	/* Delete confirmation modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 300;
		padding: 16px;
	}

	.modal-card {
		background: white;
		border-radius: 12px;
		padding: 24px;
		max-width: 300px;
		width: 100%;
		text-align: center;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.modal-message {
		margin: 0 0 20px 0;
		font-size: var(--font-body);
		font-weight: 500;
		color: var(--text-body);
	}

	.modal-actions {
		display: flex;
		gap: 10px;
	}

	.btn-modal-cancel,
	.btn-modal-delete {
		flex: 1;
		padding: 10px;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		font-size: var(--font-helper);
	}

	.btn-modal-cancel {
		background: #f0f0f0;
		color: var(--text-body);
	}

	.btn-modal-delete {
		background: #d32f2f;
		color: white;
	}

	/* Receipt drawer */
	.receipt-drawer {
		position: fixed;
		inset: 0;
		background: white;
		z-index: 500;
		display: flex;
		flex-direction: column;
		max-width: 480px;
		margin: 0 auto;
	}

	.receipt-drawer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		flex-shrink: 0;
	}

	.receipt-drawer-close,
	.receipt-action-btn {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		border: none;
		background: none;
		cursor: pointer;
		padding: 0;
	}

	.receipt-drawer-close img,
	.receipt-action-btn img {
		opacity: 0.6;
	}

	.receipt-drawer-actions {
		display: flex;
		gap: 4px;
	}

	.receipt-drawer-sep {
		height: 1px;
		background: #e5e5e5;
		flex-shrink: 0;
	}

	.receipt-drawer-body {
		flex: 1;
		overflow-y: auto;
		padding: 16px;
		display: flex;
		justify-content: center;
	}

	.toast {
		position: fixed;
		bottom: 72px;
		left: 50%;
		transform: translateX(-50%);
		background: var(--dazzle);
		color: white;
		padding: 10px 24px;
		border-radius: 8px;
		font-size: var(--font-helper);
		font-weight: 500;
		z-index: 400;
		animation: fadeInOut 2.5s ease;
		pointer-events: none;
	}

	@keyframes fadeInOut {
		0% { opacity: 0; transform: translateX(-50%) translateY(8px); }
		15% { opacity: 1; transform: translateX(-50%) translateY(0); }
		80% { opacity: 1; }
		100% { opacity: 0; }
	}
</style>
