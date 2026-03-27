<script>
	import { suppliersStore } from '$lib/stores/suppliers.svelte.js';

	let { onsubmit, oncancel, editCost } = $props();

	let isEdit = $derived(!!editCost);

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

	let date = $state(editCost?.date || todayISO());
	let dateInputRef = $state(null);

	// Stock cost fields
	let stockSupplier = $state(editCost?.costType === 'stock' ? (editCost?.supplier || '') : '');
	let stockAmountDisplay = $state(editCost?.costType === 'stock' ? formatNumber(editCost?.amount) : '');
	let stockDescription = $state(editCost?.costType === 'stock' ? (editCost?.description || '') : '');

	// Other cost fields
	let otherSupplier = $state(editCost?.costType === 'other' ? (editCost?.supplier || '') : '');
	let otherAmountDisplay = $state(editCost?.costType === 'other' ? formatNumber(editCost?.amount) : '');
	let otherDescription = $state(editCost?.costType === 'other' ? (editCost?.description || '') : '');

	function handleStockAmountBlur() {
		const num = parseNumber(stockAmountDisplay);
		stockAmountDisplay = num ? formatNumber(num) : '';
	}

	function handleOtherAmountBlur() {
		const num = parseNumber(otherAmountDisplay);
		otherAmountDisplay = num ? formatNumber(num) : '';
	}

	function handleSubmit() {
		const stockAmount = parseNumber(stockAmountDisplay);
		const otherAmount = parseNumber(otherAmountDisplay);

		const entries = [];

		if (stockAmount > 0) {
			entries.push({
				date,
				supplier: stockSupplier,
				amount: stockAmount,
				description: stockDescription.trim(),
				costType: 'stock'
			});
		}

		if (otherAmount > 0) {
			entries.push({
				date,
				supplier: otherSupplier.trim(),
				amount: otherAmount,
				description: otherDescription.trim(),
				costType: 'other'
			});
		}

		if (entries.length > 0) {
			onsubmit(entries);
		} else {
			oncancel();
		}
	}
</script>

<div class="form-overlay">
	<div class="form-card">
		<h2>{isEdit ? 'Edit cost' : 'New cost'}</h2>

		<!-- Date -->
		<div class="date-row">
			<span class="label-helper">Date</span>
			<span class="date-display" onclick={() => dateInputRef?.showPicker?.()}>
				{formatDateDisplay(date)}
			</span>
			<input
				type="date"
				class="hidden-date-input"
				bind:this={dateInputRef}
				bind:value={date}
			/>
		</div>

		<!-- Stock cost section -->
		<div class="cost-section">
			<span class="section-label">Stock</span>
			<div class="cost-input-row">
				<select class="cost-select" bind:value={stockSupplier}>
					<option value="">Select supplier</option>
					{#each suppliersStore.supplierNames as s}
						<option value={s}>{s}</option>
					{/each}
				</select>
				<div class="amount-field">
					<span class="currency-prefix">₦</span>
					<input
						type="text"
						inputmode="numeric"
						class="amount-input"
						bind:value={stockAmountDisplay}
						onblur={handleStockAmountBlur}
						placeholder="0"
					/>
				</div>
			</div>
			<input
				type="text"
				class="cost-desc-input"
				bind:value={stockDescription}
				placeholder="Description"
			/>
		</div>

		<!-- Other costs section -->
		<div class="cost-section">
			<span class="section-label">Other costs</span>
			<div class="cost-input-row">
				<input
					type="text"
					class="cost-text-input"
					bind:value={otherSupplier}
					placeholder="Add supplier"
				/>
				<div class="amount-field">
					<span class="currency-prefix">₦</span>
					<input
						type="text"
						inputmode="numeric"
						class="amount-input"
						bind:value={otherAmountDisplay}
						onblur={handleOtherAmountBlur}
						placeholder="0"
					/>
				</div>
			</div>
			<input
				type="text"
				class="cost-desc-input"
				bind:value={otherDescription}
				placeholder="Description"
			/>
		</div>

		<!-- Actions -->
		<div class="form-actions">
			<button class="btn-cancel" onclick={oncancel}>Cancel</button>
			<button class="btn-save" onclick={handleSubmit}>Save</button>
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

	/* Date row */
	.date-row {
		display: flex;
		align-items: baseline;
		gap: 6px;
		margin-bottom: 20px;
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

	.hidden-date-input {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
		pointer-events: none;
	}

	/* Cost sections */
	.cost-section {
		margin-bottom: 20px;
	}

	.section-label {
		display: block;
		font-size: var(--font-helper);
		font-weight: 600;
		color: var(--text-helper);
		margin-bottom: 6px;
	}

	.cost-input-row {
		display: flex;
		gap: 10px;
		margin-bottom: 6px;
	}

	.cost-select,
	.cost-text-input {
		flex: 1;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 14px;
		font-family: inherit;
		color: var(--text-body);
		background: white;
	}

	.cost-select {
		appearance: auto;
	}

	.amount-field {
		display: flex;
		align-items: center;
		gap: 4px;
		flex: 0 0 120px;
	}

	.currency-prefix {
		font-size: 14px;
		color: var(--text-helper);
	}

	.amount-input {
		width: 100%;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 14px;
		font-family: inherit;
		color: var(--text-body);
		background: white;
	}

	.amount-input:focus::placeholder {
		color: transparent;
	}

	.amount-input::-webkit-outer-spin-button,
	.amount-input::-webkit-inner-spin-button {
		-webkit-appearance: none;
		margin: 0;
	}

	.cost-desc-input {
		width: 100%;
		padding: 10px;
		border: 1px solid #ddd;
		border-radius: 6px;
		font-size: 14px;
		font-family: inherit;
		color: var(--text-body);
		background: white;
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
