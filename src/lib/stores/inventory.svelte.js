import { untrack } from 'svelte';
import { supabase } from '$lib/utils/supabase.js';

/**
 * @typedef {Object} Product
 * @property {string} id - DB-1001, DB-1002, etc
 * @property {string} name - Item Name
 * @property {string} category - Product category
 * @property {string} supplier - Supplier name
 * @property {number} wholesaleCost - Wholesale Cost
 * @property {number} retailPrice - Standard Retail Price
 * @property {string} stock - "Infinite", "Dropship", or number
 * @property {Array<{channel: string, dateAdded: string, isLive: boolean}>} advertisedOn - Channels (Jumia, Jiji, etc)
 * @property {string} notes - Product notes
 * @property {string} dateEntered - Date entered (26-03-2026 format)
 */

let nextId = 1001;

export function createInventoryStore() {
	const products = $state([]);

	// Load from localStorage on init
	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('dazzle_inventory');
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				const valid = parsed.filter(p => p.id && !p.id.includes('NaN'));
				products.push(...valid);
				if (valid.length > 0) {
					nextId = Math.max(...valid.map(p => parseInt(p.id.split('-')[1]))) + 1;
				}
				if (valid.length !== parsed.length) {
					localStorage.setItem('dazzle_inventory', JSON.stringify(valid));
				}
			} catch (e) {
				console.error('Failed to load inventory:', e);
			}
		}
	}

	return {
		get products() {
			return products;
		},

		addProduct(productData) {
			const id = `P-${String(nextId).padStart(5, '0')}`;
			nextId++;

			const product = {
				id,
				name: productData.name,
				category: productData.category || '',
				supplier: productData.supplier,
				wholesaleCost: parseFloat(productData.wholesaleCost),
				retailPrice: parseFloat(productData.retailPrice),
				stock: productData.stock,
				advertisedOn: productData.advertisedOn || [],
				notes: productData.notes,
				dateEntered: new Date().toISOString().split('T')[0]
			};

			products.push(product);
			this.save();
			return product;
		},

		updateProduct(id, updates) {
			const idx = products.findIndex(p => p.id === id);
			if (idx === -1) return;

			Object.assign(products[idx], updates);
			this.save();
		},

		deleteProduct(id) {
			const idx = products.findIndex(p => p.id === id);
			if (idx !== -1) {
				products.splice(idx, 1);
				this.save();
			}
		},

		save() {
			if (typeof window !== 'undefined') {
				localStorage.setItem('dazzle_inventory', JSON.stringify(untrack(() => products)));
			}
		},

		async sync() {
			if (typeof window === 'undefined') return;
			const data = untrack(() => [...products]);

			const rows = data.map(p => ({
				id: p.id,
				name: p.name,
				category: p.category || '',
				supplier: p.supplier,
				wholesale_cost: p.wholesaleCost,
				retail_price: p.retailPrice,
				stock: p.stock,
				advertised_on: p.advertisedOn,
				notes: p.notes || '',
				date_entered: p.dateEntered
			}));

			const { error } = await supabase
				.from('inventory')
				.upsert(rows, { onConflict: 'id' });

			if (error) {
				console.error('Inventory sync failed:', error.message);
			} else {
				console.log('Inventory synced:', rows.length, 'products');
			}
		},

		async deleteFromRemote(id) {
			const { error } = await supabase.from('inventory').delete().eq('id', id);
			if (error) console.error('Remote delete failed:', error.message);
		}
	};
}

export const inventoryStore = createInventoryStore();
