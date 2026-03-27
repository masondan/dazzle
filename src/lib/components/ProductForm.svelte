<script>
	import { suppliersStore } from '$lib/stores/suppliers.svelte.js';
	import { inventoryStore } from '$lib/stores/inventory.svelte.js';

	let { onsubmit, oncancel, editProduct } = $props();

	const channels = ['Jumia', 'Jiji', 'Instagram', 'WhatsApp', 'Konga'];

	function todayISO() {
		return new Date().toISOString().split('T')[0];
	}

	function formatDateDisplay(isoStr) {
		const d = new Date(isoStr + 'T00:00:00');
		return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
	}

	function formatNumber(val) {
		if (!val && val !== 0) return '';
		return Number(val).toLocaleString('en-NG');
	}

	function parseNumber(str) {
		return Number(String(str).replace(/,/g, '')) || 0;
	}

	function getNextDisplayId() {
		const products = inventoryStore.products;
		if (products.length === 0) return 'P-00001';
		const maxNum = Math.max(...products.map(p => parseInt(p.id.split('-')[1]) || 0));
		return `P-${String(maxNum + 1).padStart(5, '0')}`;
	}

	let isEdit = $derived(!!editProduct);
	let displayId = $derived(isEdit ? editProduct.id : getNextDisplayId());

	let dateEntered = $state(editProduct?.dateEntered
		? (() => {
			const parts = editProduct.dateEntered.split('-');
			if (parts[0].length === 4) return editProduct.dateEntered;
			return `${parts[2]}-${parts[1]}-${parts[0]}`;
		})()
		: todayISO()
	);
	let name = $state(editProduct?.name ?? '');
	let category = $state(editProduct?.category ?? '');
	let supplier = $state(editProduct?.supplier ?? '');
	let wholesaleDisplay = $state(editProduct ? formatNumber(editProduct.wholesaleCost) : '');
	let retailDisplay = $state(editProduct ? formatNumber(editProduct.retailPrice) : '');
	let stockType = $state(
		editProduct
			? (editProduct.stock === 'Dropship' ? 'Dropship' : 'Stock')
			: 'Dropship'
	);
	let stockQty = $state(
		editProduct && editProduct.stock !== 'Dropship'
			? String(editProduct.stock)
			: '0'
	);
	let advertisedOn = $state(
		editProduct?.advertisedOn
			? editProduct.advertisedOn.map(a => ({ channel: a.channel, dateAdded: a.dateAdded }))
			: []
	);
	let notes = $state(editProduct?.notes ?? '');

	let dateInputRef = $state(null);
	let channelDateRefs = $state({});

	function isChannelChecked(channel) {
		return advertisedOn.some(a => a.channel === channel);
	}

	function toggleChannel(channel) {
		const idx = advertisedOn.findIndex(a => a.channel === channel);
		if (idx === -1) {
			advertisedOn = [...advertisedOn, { channel, dateAdded: todayISO() }];
		} else {
			advertisedOn = advertisedOn.filter(a => a.channel !== channel);
		}
	}

	function onChannelDateChange(channel, newDate) {
		advertisedOn = advertisedOn.map(a =>
			a.channel === channel ? { ...a, dateAdded: newDate } : a
		);
	}

	function handleWholesaleBlur() {
		const num = parseNumber(wholesaleDisplay);
		wholesaleDisplay = num ? formatNumber(num) : '';
	}

	function handleRetailBlur() {
		const num = parseNumber(retailDisplay);
		retailDisplay = num ? formatNumber(num) : '';
	}

	function handleSubmit() {
		if (!name.trim()) {
			alert('Please fill in the item name');
			return;
		}

		const formData = {
			name: name.trim(),
			category,
			supplier,
			wholesaleCost: parseNumber(wholesaleDisplay),
			retailPrice: parseNumber(retailDisplay),
			stock: stockType === 'Dropship' ? 'Dropship' : (parseInt(stockQty) || 0),
			advertisedOn: advertisedOn.map(a => ({ channel: a.channel, dateAdded: a.dateAdded })),
			notes,
			dateEntered
		};

		onsubmit(formData);
	}
</script>

<div class="form-overlay">
	<div class="form-card">
		<h2>{isEdit ? 'Edit product' : 'New product'}</h2>

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

		<!-- Item -->
		<div class="form-group">
			<label>Item</label>
			<input type="text" bind:value={name} placeholder="Description" required />
		</div>

		<!-- Category -->
		<div class="form-group">
			<label>Category</label>
			<select bind:value={category}>
				<option value="">Select category</option>
				<option value="Household">Household</option>
				<option value="Fashion">Fashion</option>
				<option value="Digital">Digital</option>
			</select>
		</div>

		<!-- Supplier -->
		<div class="form-group">
			<label>Supplier</label>
			<select bind:value={supplier}>
				<option value="">select supplier</option>
				{#each suppliersStore.supplierNames as s}
					<option value={s}>{s}</option>
				{/each}
			</select>
		</div>

		<!-- Wholesale / Retail -->
		<div class="form-row">
			<div class="form-group">
				<label>Wholesale (₦)</label>
				<input
					type="text"
					inputmode="numeric"
					bind:value={wholesaleDisplay}
					onblur={handleWholesaleBlur}
					placeholder="0"
				/>
			</div>
			<div class="form-group">
				<label>Retail (₦)</label>
				<input
					type="text"
					inputmode="numeric"
					bind:value={retailDisplay}
					onblur={handleRetailBlur}
					placeholder="0"
				/>
			</div>
		</div>

		<!-- Stock row -->
		<div class="stock-row">
			<label class="stock-option">
				<input
					type="checkbox"
					class="pink-check"
					checked={stockType === 'Dropship'}
					onchange={() => { stockType = 'Dropship'; }}
				/>
				Dropship
			</label>
			<div class="stock-right">
				<label class="stock-option">
					<input
						type="checkbox"
						class="pink-check"
						checked={stockType === 'Stock'}
						onchange={() => { stockType = 'Stock'; }}
					/>
					Stock
				</label>
				<input
					type="text"
					inputmode="numeric"
					class="stock-qty-input"
					class:disabled={stockType !== 'Stock'}
					bind:value={stockQty}
					placeholder="0"
					disabled={stockType !== 'Stock'}
					onfocus={(e) => { if (e.target.value === '0') e.target.value = ''; }}
					onblur={(e) => { if (!e.target.value) stockQty = '0'; }}
				/>
			</div>
		</div>

		<!-- Platform -->
		<div class="form-group">
			<label>Platform</label>
			<div class="channels-grid">
				{#each channels as channel}
					{@const checked = isChannelChecked(channel)}
					<div class="channel-panel" class:checked>
						<button
							type="button"
							class="custom-checkbox"
							class:checked
							onclick={() => toggleChannel(channel)}
						>
							{#if checked}
								<span class="checkmark">✓</span>
							{/if}
						</button>
						<span class="channel-name" onclick={() => toggleChannel(channel)}>{channel}</span>
						<button
							type="button"
							class="calendar-icon"
							onclick={() => {
								if (checked) {
									channelDateRefs[channel]?.showPicker?.();
								}
							}}
						>
							<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
								<rect x="1" y="3" width="14" height="12" rx="1.5" stroke="#999" stroke-width="1.2" fill="none"/>
								<line x1="1" y1="7" x2="15" y2="7" stroke="#999" stroke-width="1.2"/>
								<line x1="5" y1="1" x2="5" y2="5" stroke="#999" stroke-width="1.2" stroke-linecap="round"/>
								<line x1="11" y1="1" x2="11" y2="5" stroke="#999" stroke-width="1.2" stroke-linecap="round"/>
							</svg>
						</button>
						<input
							type="date"
							class="hidden-date-input"
							bind:this={channelDateRefs[channel]}
							value={advertisedOn.find(a => a.channel === channel)?.dateAdded ?? todayISO()}
							onchange={(e) => onChannelDateChange(channel, e.target.value)}
						/>
					</div>
				{/each}
			</div>
		</div>

		<!-- Notes -->
		<div class="form-group">
			<label>Notes</label>
			<textarea bind:value={notes}></textarea>
		</div>

		<!-- Actions -->
		<div class="form-actions">
			<button class="btn-save" type="button" onclick={handleSubmit}>Save product</button>
			<button class="btn-cancel" type="button" onclick={oncancel}>Cancel</button>
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

	.form-card h2 {
		margin: 0 0 16px 0;
		font-size: 20px;
		color: var(--dazzle);
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

	/* Form groups */
	.form-group {
		margin-bottom: 16px;
	}

	.form-group label {
		display: block;
		font-size: var(--font-helper);
		font-weight: 600;
		color: var(--text-helper);
		margin-bottom: 6px;
	}

	.form-group input[type='text'],
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 14px;
		font-family: inherit;
		color: var(--text-body);
		background: white;
	}

	.form-group select {
		appearance: auto;
	}

	.form-group textarea {
		resize: vertical;
		min-height: 80px;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	/* Stock row */
	.stock-row {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 16px;
	}

	.stock-option {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: var(--font-body);
		color: var(--text-body);
		cursor: pointer;
	}

	.pink-check {
		width: 18px;
		height: 18px;
		cursor: pointer;
		appearance: none;
		-webkit-appearance: none;
		border: 2px solid #ccc;
		border-radius: 4px;
		background: white;
		position: relative;
	}

	.pink-check:checked {
		background: var(--dazzle);
		border-color: var(--dazzle);
	}

	.pink-check:checked::after {
		content: '✓';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		font-size: 12px;
		font-weight: 700;
		line-height: 1;
	}

	.stock-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.stock-qty-input {
		width: 60px;
		padding: 6px 8px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 14px;
		font-family: inherit;
		text-align: center;
		color: var(--text-body);
		background: white;
	}

	.stock-qty-input.disabled {
		opacity: 0.35;
		background: #f5f5f5;
	}

	/* Channels / Platform grid */
	.channels-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
	}

	.channel-panel {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 6px;
		background: #fafafa;
		position: relative;
	}

	.channel-panel.checked {
		background: #fafafa;
		border-color: #ddd;
	}

	.custom-checkbox {
		width: 20px;
		height: 20px;
		min-width: 20px;
		border: 2px solid #ccc;
		border-radius: 4px;
		background: white;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		padding: 0;
		appearance: none;
		-webkit-appearance: none;
	}

	.custom-checkbox.checked {
		background: var(--dazzle);
		border-color: var(--dazzle);
	}

	.checkmark {
		color: white;
		font-size: 13px;
		font-weight: 700;
		line-height: 1;
	}

	.channel-name {
		flex: 1;
		font-size: 14px;
		color: var(--text-body);
		cursor: pointer;
	}

	.calendar-icon {
		background: none;
		border: none;
		padding: 2px;
		cursor: pointer;
		display: flex;
		align-items: center;
		opacity: 0.5;
	}

	.calendar-icon:hover {
		opacity: 0.8;
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
		font-size: 14px;
	}

	.btn-save {
		background: var(--dazzle);
		color: white;
	}

	.btn-cancel {
		background: #f0f0f0;
		color: #333;
	}
</style>
