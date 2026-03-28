<script>
	import { inventoryStore } from '$lib/stores/inventory.svelte.js';
	import { ordersStore } from '$lib/stores/orders.svelte.js';

	let { onsubmit, oncancel, editOrder } = $props();

	const sources = ['WhatsApp', 'Jiji', 'Jumia', 'Konga', 'Instagram', 'Referral', 'Personal', 'Other'];

	let isEdit = $derived(!!editOrder);

	let mode = $state(editOrder ? (editOrder.status === 'lead' ? 'lead' : 'order') : 'order');
	let isLead = $derived(mode === 'lead');

	function todayISO() {
		return new Date().toISOString().split('T')[0];
	}

	function formatDateDisplay(isoStr) {
		const d = new Date(isoStr + 'T00:00:00');
		return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
	}

	function getNextDisplayId() {
		const orders = ordersStore.orders;
		if (orders.length === 0) return 'O-00001';
		const maxNum = Math.max(...orders.map(o => parseInt(o.id.split('-')[1]) || 0));
		return `O-${String(maxNum + 1).padStart(5, '0')}`;
	}

	let displayId = $derived(isEdit ? editOrder.id : getNextDisplayId());
	let dateEntered = $state(editOrder?.date || todayISO());
	let dateInputRef = $state(null);

	let customerName = $state(editOrder?.customerName ?? '');
	let customerPhone = $state('');
	let phones = $state(editOrder?.customerPhone ? editOrder.customerPhone.split(', ') : ['']);
	let addresses = $state(editOrder?.addresses?.length ? editOrder.addresses : [{type: '', address: ''}]);
	let source = $state(editOrder?.source ?? '');
	let notes = $state(editOrder?.notes ?? '');
	let paymentMethod = $state(editOrder?.paymentMethod ?? 'Bank transfer');

	let itemSearch = $state('');
	let selectedItems = $state(editOrder?.items?.length ? editOrder.items.map(i => ({ ...i })) : []);
	let showItemPicker = $state(false);

	let matchedProducts = $derived(
		itemSearch.length >= 2
			? inventoryStore.products.filter(p =>
				p.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
				p.id.toLowerCase().includes(itemSearch.toLowerCase())
			)
			: []
	);

	let orderTotal = $derived(
		selectedItems.reduce((sum, item) => sum + item.salePrice * item.qty, 0)
	);

	function addPhone() {
		phones = [...phones, ''];
	}

	function addAddress() {
		if (addresses.length < 3) {
			addresses = [...addresses, {type: '', address: ''}];
		}
	}



	function selectProduct(product) {
		const existing = selectedItems.find(i => i.productId === product.id);
		if (existing) {
			selectedItems = selectedItems.map(i =>
				i.productId === product.id ? { ...i, qty: i.qty + 1 } : i
			);
		} else {
			selectedItems = [...selectedItems, {
				productId: product.id,
				name: product.name,
				qty: 1,
				retailPrice: product.retailPrice,
				salePrice: product.retailPrice
			}];
		}
		itemSearch = '';
		showItemPicker = false;
	}

	function removeItem(idx) {
		selectedItems = selectedItems.filter((_, i) => i !== idx);
	}

	function updateItemQty(idx, delta) {
		const newQty = selectedItems[idx].qty + delta;
		if (newQty < 1) return;
		selectedItems = selectedItems.map((item, i) =>
			i === idx ? { ...item, qty: newQty } : item
		);
	}

	function formatNumber(val) {
		if (!val && val !== 0) return '';
		return Number(val).toLocaleString('en-NG');
	}

	function parseNumber(str) {
		return Number(String(str).replace(/,/g, '')) || 0;
	}

	function handlePriceBlur(idx, e) {
		const num = parseNumber(e.target.value);
		selectedItems = selectedItems.map((item, i) =>
			i === idx ? { ...item, salePrice: num } : item
		);
		e.target.value = num ? formatNumber(num) : '';
	}

	function handlePriceFocus(idx, e) {
		const item = selectedItems[idx];
		e.target.value = item.salePrice || '';
	}

	function handleSubmit() {
		const allPhones = phones.filter(p => p.trim());
		const allAddresses = addresses.filter(a => a.address.trim());
		if (!customerName.trim()) { alert('Please enter customer name'); return; }
		if (allPhones.length === 0) { alert('Please enter a phone number'); return; }
		if (selectedItems.length === 0) { alert('Please add at least one item'); return; }

		onsubmit({
			customerName: customerName.trim(),
			customerPhone: allPhones.join(', '),
			addresses: allAddresses,
			source,
			notes: notes.trim(),
			paymentMethod,
			items: selectedItems,
			date: dateEntered,
			status: isLead ? 'lead' : 'customer'
		});
	}

	function autoGrow(e) {
		e.target.style.height = 'auto';
		e.target.style.height = e.target.scrollHeight + 'px';
	}
</script>

<div class="form-overlay">
	<div class="form-card">
		<!-- Toggle: Order / Lead -->
		<div class="mode-toggle">
			<button
				class="toggle-btn"
				class:active={mode === 'order'}
				onclick={() => (mode = 'order')}
			>{isEdit ? 'Edit order' : 'New order'}</button>
			<button
				class="toggle-btn"
				class:active={mode === 'lead'}
				onclick={() => (mode = 'lead')}
			>{isEdit ? 'Edit lead' : 'New lead'}</button>
		</div>

		<!-- Date + ID row -->
		<div class="date-id-row">
			<div class="date-section">
				<span class="label-helper">Date</span>
				<span class="date-display" onclick={() => dateInputRef?.showPicker?.()}>
					{formatDateDisplay(dateEntered)}
				</span>
				<input
					type="date"
					class="hidden-date-input"
					bind:this={dateInputRef}
					bind:value={dateEntered}
				/>
			</div>
			<div class="id-section">
				<span class="label-helper">ID</span>
				<span class="id-value">{displayId}</span>
			</div>
		</div>

		<div class="form-group">
			<label>Customer name *</label>
			<input type="text" bind:value={customerName} placeholder="Full name" />
		</div>

		<div class="form-group">
			<label>Phone *</label>
			{#each phones as phone, idx}
				<input type="tel" bind:value={phones[idx]} class="phone-input" />
			{/each}
			<button type="button" class="btn-add-link" onclick={addPhone}>+ Phone</button>
		</div>

		<div class="form-group">
			<label>Delivery address</label>
			{#each addresses as addr, idx}
				<textarea
					bind:value={addresses[idx].address}
					placeholder="Enter address"
					rows="2"
					oninput={autoGrow}
					class="address-input"
				></textarea>
			{/each}
			{#if addresses.length < 3}
				<button type="button" class="btn-add-link" onclick={addAddress}>+ Address</button>
			{/if}
		</div>

		<div class="form-group">
			<label>Source</label>
			<select bind:value={source}>
				<option value="">Select source</option>
				{#each sources as s}
					<option value={s}>{s}</option>
				{/each}
			</select>
		</div>

		<div class="form-group">
			<label>Items *</label>
			<div class="item-search-wrap">
				<input
					type="text"
					bind:value={itemSearch}
					placeholder="Search for product"
					onfocus={() => (showItemPicker = true)}
				/>
				{#if showItemPicker && matchedProducts.length > 0}
					<div class="item-dropdown">
						{#each matchedProducts as product}
							<button type="button" class="dropdown-item" onclick={() => selectProduct(product)}>
								<span class="di-name">{product.name}</span>
								<span class="di-price">₦{product.retailPrice.toLocaleString()}</span>
							</button>
						{/each}
					</div>
				{/if}
			</div>

			{#if selectedItems.length > 0}
				<div class="selected-items">
					{#each selectedItems as item, idx}
						<div class="item-row">
							<div class="item-info">
								<span class="item-name">{item.name}</span>
								<div class="item-controls">
									<div class="qty-control">
										<button type="button" onclick={() => updateItemQty(idx, -1)}>−</button>
										<span>{item.qty}</span>
										<button type="button" onclick={() => updateItemQty(idx, 1)}>+</button>
									</div>
									<div class="price-edit">
										<span>₦</span>
										<input
											type="text"
											inputmode="numeric"
											value={formatNumber(item.salePrice)}
											onfocus={(e) => handlePriceFocus(idx, e)}
											onblur={(e) => handlePriceBlur(idx, e)}
										/>
									</div>
									<button type="button" class="btn-remove-item" onclick={() => removeItem(idx)}>
										<img src="/icons/icon-trash.svg" alt="Remove" width="14" height="14" />
									</button>
								</div>
							</div>
						</div>
					{/each}
					<div class="order-total">
						<span>Total</span>
						<span class="total-value">₦{orderTotal.toLocaleString()}</span>
					</div>
				</div>
			{/if}
		</div>

		<div class="form-group">
			<label>Payment method</label>
			<select bind:value={paymentMethod}>
				<option value="Bank transfer">Bank transfer</option>
				<option value="Cash">Cash</option>
			</select>
		</div>

		<div class="form-group">
			<label>Notes</label>
			<textarea bind:value={notes} rows="2" oninput={autoGrow}></textarea>
		</div>

		<div class="form-actions">
			<button class="btn-save" onclick={handleSubmit}>{isLead ? 'Save lead' : 'Save order'}</button>
			<button class="btn-cancel" onclick={oncancel}>Cancel</button>
		</div>
	</div>
</div>

<style>
	.form-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		padding: 16px;
	}

	.form-card {
		background: white;
		border-radius: 12px;
		padding: 20px;
		max-width: 420px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	/* Toggle buttons */
	.mode-toggle {
		display: flex;
		gap: 0;
		margin-bottom: 16px;
		border: 1px solid var(--dazzle);
		border-radius: 8px;
		overflow: hidden;
	}

	.toggle-btn {
		flex: 1;
		padding: 10px;
		border: none;
		background: white;
		color: var(--dazzle);
		font-size: var(--font-body);
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.toggle-btn.active {
		background: var(--dazzle);
		color: white;
	}

	/* Date + ID row */
	.date-id-row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		margin-bottom: 16px;
	}

	.date-section,
	.id-section {
		display: flex;
		align-items: baseline;
		gap: 6px;
	}

	.label-helper {
		font-size: var(--font-helper);
		color: var(--text-helper);
	}

	.date-display {
		font-size: var(--font-body);
		color: var(--text-body);
		cursor: pointer;
	}

	.id-value {
		font-size: var(--font-body);
		color: var(--text-body);
	}

	.hidden-date-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
		pointer-events: none;
	}

	.form-group {
		margin-bottom: 16px;
	}

	.form-group > label {
		display: block;
		font-size: var(--font-helper);
		font-weight: 600;
		color: var(--text-helper);
		margin-bottom: 6px;
	}

	.form-group input[type='text'],
	.form-group input[type='tel'],
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: var(--font-body);
		font-family: inherit;
		color: var(--text-body);
	}

	.form-group textarea {
		resize: none;
		overflow: hidden;
		min-height: 42px;
	}

	.phone-input {
		margin-bottom: 6px;
	}

	.address-input {
		margin-bottom: 6px;
	}

	.btn-add-link {
		background: none;
		border: none;
		color: var(--dazzle);
		font-size: var(--font-helper);
		font-weight: 600;
		cursor: pointer;
		padding: 4px 0;
	}

	.form-group .address-input + .btn-add-link {
		margin-top: -4px;
	}

	/* Item search */
	.item-search-wrap {
		position: relative;
	}

	.item-dropdown {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: white;
		border: 1px solid #ddd;
		border-radius: 0 0 6px 6px;
		max-height: 160px;
		overflow-y: auto;
		z-index: 10;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.dropdown-item {
		display: flex;
		justify-content: space-between;
		width: 100%;
		padding: 10px 12px;
		border: none;
		background: none;
		cursor: pointer;
		font-size: var(--font-helper);
		text-align: left;
	}

	.dropdown-item:hover {
		background: #f5f5f5;
	}

	.di-name {
		color: var(--text-body);
		font-weight: 500;
	}

	.di-price {
		color: var(--text-helper);
		font-size: 12px;
	}

	/* Selected items */
	.selected-items {
		margin-top: 10px;
		border: 1px solid #eee;
		border-radius: 8px;
		overflow: hidden;
	}

	.item-row {
		padding: 10px 12px;
		border-bottom: 1px solid #f0f0f0;
	}

	.item-row:last-child {
		border-bottom: none;
	}

	.item-info {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.item-name {
		font-size: var(--font-helper);
		font-weight: 600;
		color: var(--text-body);
	}

	.item-controls {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.qty-control {
		display: flex;
		align-items: center;
		border: 1px solid #ddd;
		border-radius: 6px;
		overflow: hidden;
	}

	.qty-control button {
		width: 30px;
		height: 28px;
		border: none;
		background: #f5f5f5;
		cursor: pointer;
		font-size: var(--font-helper);
		font-weight: 600;
		color: var(--text-body);
	}

	.qty-control button:active {
		background: #e0e0e0;
	}

	.qty-control span {
		width: 28px;
		text-align: center;
		font-size: var(--font-helper);
		font-weight: 600;
	}

	.price-edit {
		display: flex;
		align-items: center;
		gap: 2px;
		flex: 1;
	}

	.price-edit span {
		font-size: var(--font-helper);
		color: var(--text-helper);
	}

	.price-edit input {
		width: 80px;
		padding: 4px 6px;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: var(--font-helper);
		text-align: right;
		font-family: inherit;
		color: var(--text-body);
	}

	.btn-remove-item {
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		opacity: 0.5;
	}

	.btn-remove-item:hover {
		opacity: 1;
	}

	.order-total {
		display: flex;
		justify-content: space-between;
		padding: 10px 12px;
		background: #f9f9f9;
		font-weight: 600;
		font-size: var(--font-body);
	}

	.total-value {
		color: var(--dazzle);
	}

	/* Actions */
	.form-actions {
		display: flex;
		gap: 10px;
		margin-top: 20px;
	}

	.btn-save,
	.btn-cancel {
		flex: 1;
		padding: 12px;
		border: none;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		font-size: var(--font-body);
	}

	.btn-save {
		background: var(--dazzle);
		color: white;
	}

	.btn-cancel {
		background: #f0f0f0;
		color: var(--text-body);
	}
</style>
