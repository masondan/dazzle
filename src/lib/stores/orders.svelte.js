import { untrack } from 'svelte';
import { supabase } from '$lib/utils/supabase.js';

/**
 * @typedef {Object} Order
 * @property {string} id - Order ID (auto-generated)
 * @property {string} date - Order date (26-03-2026 format)
 * @property {string} customerName - Customer Name
 * @property {string} customerPhone - Customer Phone
 * @property {Array<{type: string, address: string}>} addresses - Delivery addresses (Home, Office, Other)
 * @property {string} source - Source (Jumia, Jiji, WhatsApp, etc.)
 * @property {string} notes - General notes
 * @property {Array<{productId: string, name: string, qty: number, retailPrice: number, salePrice: number}>} items - Order items
 * @property {string} paymentMethod - Payment method (Bank transfer, Cash)
 * @property {string} status - 'lead' | 'customer' | 'processing' | 'completed'
 */

let nextOrderNum = 1;

export function createOrdersStore() {
	const orders = $state([]);

	if (typeof window !== 'undefined') {
		const stored = localStorage.getItem('dazzle_orders');
		if (stored) {
			try {
				const parsed = JSON.parse(stored);
				orders.push(...parsed);
				if (parsed.length > 0) {
					nextOrderNum = Math.max(...parsed.map(o => parseInt(o.id.split('-')[1]))) + 1;
				}
			} catch (e) {
				console.error('Failed to load orders:', e);
			}
		}
	}

	return {
		get orders() {
			return orders;
		},

		addOrder(orderData) {
			const id = `O-${String(nextOrderNum).padStart(5, '0')}`;
			nextOrderNum++;

			const order = {
				id,
				date: orderData.date || new Date().toISOString().split('T')[0],
				customerName: orderData.customerName,
				customerPhone: orderData.customerPhone,
				addresses: orderData.addresses || [],
				source: orderData.source,
				notes: orderData.notes,
				items: orderData.items || [],
				paymentMethod: orderData.paymentMethod || 'Bank transfer',
				status: orderData.status || 'lead'
			};

			orders.push(order);
			this.save();
			return order;
		},

		updateOrder(id, updates) {
			const idx = orders.findIndex(o => o.id === id);
			if (idx === -1) return;

			Object.assign(orders[idx], updates);
			this.save();
		},

		updateOrderStatus(id, status) {
			const idx = orders.findIndex(o => o.id === id);
			if (idx === -1) return;

			orders[idx].status = status;
			this.save();
		},

		deleteOrder(id) {
			const idx = orders.findIndex(o => o.id === id);
			if (idx !== -1) {
				orders.splice(idx, 1);
				this.save();
			}
		},

		getOrderById(id) {
			return orders.find(o => o.id === id);
		},

		filterByStatus(status) {
			if (status === 'all') return orders;
			return orders.filter(o => o.status === status);
		},

		calculateOrderTotal(order) {
			return order.items.reduce((sum, item) => sum + item.salePrice * item.qty, 0);
		},

		calculateOrderProfit(order, productMap) {
			let profit = 0;
			order.items.forEach(item => {
				const product = productMap[item.productId];
				if (product) {
					profit += (item.salePrice - product.wholesaleCost) * item.qty;
				}
			});
			return profit;
		},

		save() {
			if (typeof window !== 'undefined') {
				localStorage.setItem('dazzle_orders', JSON.stringify(untrack(() => orders)));
			}
		},

		async sync() {
			if (typeof window === 'undefined') return;
			const data = untrack(() => [...orders]);

			const rows = data.map(o => ({
				id: o.id,
				date: o.date,
				customer_name: o.customerName,
				customer_phone: o.customerPhone,
				addresses: o.addresses,
				source: o.source,
				notes: o.notes || '',
				items: o.items,
				payment_method: o.paymentMethod || 'Bank transfer',
				status: o.status
			}));

			const { error } = await supabase
				.from('orders')
				.upsert(rows, { onConflict: 'id' });

			if (error) {
				console.error('Orders sync failed:', error.message);
			} else {
				console.log('Orders synced:', rows.length, 'orders');
			}
		},

		async deleteFromRemote(id) {
			const { error } = await supabase.from('orders').delete().eq('id', id);
			if (error) console.error('Remote delete failed:', error.message);
		}
	};
}

export const ordersStore = createOrdersStore();
