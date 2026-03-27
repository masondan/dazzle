<script>
	let { products = [], ondelete, onedit } = $props();

	let expandedId = $state(null);
	let deleteConfirmId = $state(null);

	function toggleExpand(id) {
		expandedId = expandedId === id ? null : id;
	}

	function confirmDelete(id) {
		deleteConfirmId = id;
	}

	function cancelDelete() {
		deleteConfirmId = null;
	}

	function executeDelete() {
		if (deleteConfirmId) {
			ondelete(deleteConfirmId);
			deleteConfirmId = null;
			if (expandedId === deleteConfirmId) expandedId = null;
		}
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
</script>

<div class="product-grid">
	{#each products as product (product.id)}
		<div class="product-card" class:expanded={expandedId === product.id}>
			<button class="card-header" onclick={() => toggleExpand(product.id)}>
				<div class="header-left">
					<span class="product-name">{product.name}</span>
					<div class="header-meta">
						<span class="meta-pair"><span class="ml">ID</span> <span class="mv">{product.id}</span></span>
						{#if product.dateEntered}
							<span class="meta-sep">|</span>
							<span class="meta-pair"><span class="ml">Date</span> <span class="mv">{formatDate(product.dateEntered)}</span></span>
						{/if}
					</div>
				</div>
				<img
					src={expandedId === product.id ? '/icons/icon-collapse.svg' : '/icons/icon-expand.svg'}
					alt=""
					class="expand-icon"
					width="20"
					height="20"
				/>
			</button>

			{#if expandedId === product.id}
				<div class="card-body">
					<div class="detail-row">
						<span class="detail-label">Supplier</span>
						<span class="detail-value">{product.supplier}</span>
					</div>

					<div class="detail-row-pair">
						<div class="detail-col">
							<span class="detail-label">Cost</span>
							<span class="detail-value">₦{product.wholesaleCost.toLocaleString()}</span>
						</div>
						<div class="detail-col">
							<span class="detail-label">Retail</span>
							<span class="detail-value">₦{product.retailPrice.toLocaleString()}</span>
						</div>
					</div>

					<div class="detail-row-pair">
						{#if product.category}
							<div class="detail-col">
								<span class="detail-label">Category</span>
								<span class="detail-value">{product.category}</span>
							</div>
						{/if}
						<div class="detail-col">
							<span class="detail-label">Stock</span>
							<span class="detail-value">{product.stock}</span>
						</div>
					</div>

					{#if product.advertisedOn && product.advertisedOn.length > 0}
						<div class="detail-row">
							<span class="detail-label">Platform</span>
							<span class="detail-value">
								{product.advertisedOn.map(a => a.channel).join(' | ')}
							</span>
						</div>
					{/if}

					{#if product.notes}
						<div class="notes-block">{product.notes}</div>
					{/if}

					<div class="card-actions">
						<button class="btn-edit" onclick={() => onedit(product)}>
							<img src="/icons/icon-edit.svg" alt="" width="14" height="14" />
							Edit
						</button>
						<button class="btn-delete" onclick={() => confirmDelete(product.id)}>
							<img src="/icons/icon-trash.svg" alt="" width="14" height="14" />
							Delete
						</button>
					</div>
				</div>
			{/if}
		</div>
	{/each}
</div>

{#if deleteConfirmId}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-overlay" onclick={cancelDelete}>
		<div class="modal-card" onclick={(e) => e.stopPropagation()}>
			<p class="modal-message">Delete this item?</p>
			<div class="modal-actions">
				<button class="btn-modal-cancel" onclick={cancelDelete}>Cancel</button>
				<button class="btn-modal-delete" onclick={executeDelete}>Delete</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.product-grid {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.product-card {
		background: white;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
	}

	.product-card.expanded {
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
	}

	.header-left {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.product-name {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-body);
	}

	.header-meta {
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

	.card-body {
		padding: 0 12px 12px;
		border-top: 1px solid #f0f0f0;
	}

	.detail-row {
		padding: 8px 0;
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.detail-row-pair {
		display: flex;
		gap: 16px;
		padding: 8px 0;
	}

	.detail-col {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.detail-label {
		font-size: var(--font-helper);
		color: var(--text-helper);
		flex-shrink: 0;
	}

	.detail-value {
		font-size: var(--font-body);
		color: var(--text-body);
		font-weight: 500;
	}

	.notes-block {
		padding: 8px 10px;
		background: #f5f5f5;
		border-radius: 6px;
		font-size: var(--font-helper);
		color: var(--text-helper);
		margin: 8px 0;
	}

	.card-actions {
		display: flex;
		justify-content: space-between;
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px solid #f0f0f0;
	}

	.btn-edit,
	.btn-delete {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		border: 1px solid #ddd;
		background: white;
		border-radius: 6px;
		cursor: pointer;
		font-size: var(--font-helper);
		font-weight: 500;
		color: var(--text-body);
	}

	.btn-delete {
		color: #d32f2f;
		border-color: #ffcdd2;
	}

	.btn-delete:hover {
		background: #ffebee;
	}

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
</style>
