"use client";

import { useEffect, useState } from "react";

export default function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        alert("Something went wrong loading orders");
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      {/* Add Product */}
      <AddProduct />

      {/* Orders */}
      <OrderList orders={orders} setOrders={setOrders} />
    </div>
  );
}

function AddProduct() {
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "",
    image: "",
    stock: "",
  });

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
        }),
      });

      if (!res.ok) throw new Error("Failed to add product");
      alert("Product added!");
    } catch (err) {
      alert("Something went wrong adding product");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-2">
      <h2 className="font-bold">Add Product</h2>

      <input placeholder="Name" onChange={(e) => setForm({...form, name: e.target.value})} />
      <input placeholder="Price" onChange={(e) => setForm({...form, price: e.target.value})} />
      <input placeholder="Category" onChange={(e) => setForm({...form, category: e.target.value})} />
      <input placeholder="Image URL (/products/...)" onChange={(e) => setForm({...form, image: e.target.value})} />
      <input placeholder="Stock" onChange={(e) => setForm({...form, stock: e.target.value})} />

      <button className="bg-green-600 text-white p-2 mt-2">
        Add Product
      </button>
    </form>
  );
}

function OrderList({ orders, setOrders }: any) {

  const updateStatus = async (id: string, status: string) => {
    try {
      setOrders((prev: any[]) =>
        prev.map(o => o._id === id ? { ...o, status } : o)
      );

      const res = await fetch("/api/orders/update", {
        method: "POST",
        body: JSON.stringify({ id, status }),
      });

      if (!res.ok) throw new Error("Failed to update status");
    } catch (err) {
      alert("Something went wrong updating status");
    }
  };

  return (
    <div className="mt-8">
      <h2 className="font-bold">Orders</h2>

      {orders.map((order: any) => (
        <div key={order._id} className="border p-4 mt-4">

          <p><b>Name:</b> {order.userName}</p>
          <p><b>Total:</b> ₹{order.total}</p>
          <p><b>Status:</b> {order.status}</p>

          {/* Items */}
          <div className="mt-2">
            {order.items.map((item: any, i: number) => (
              <p key={i}>
                {item.name} x {item.quantity}
              </p>
            ))}
          </div>

          {/* Status Buttons */}
          <div className="flex gap-2 mt-3">
            <button onClick={() => updateStatus(order._id, "confirmed")}>
              Confirm
            </button>

            <button onClick={() => updateStatus(order._id, "packed")}>
              Pack
            </button>

            <button onClick={() => updateStatus(order._id, "delivered")}>
              Deliver
            </button>
          </div>

        </div>
      ))}
    </div>
  );
}
