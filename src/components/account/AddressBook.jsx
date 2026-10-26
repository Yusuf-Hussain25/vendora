"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAddress, setDefaultAddress } from "@/actions/address";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import AddressForm from "./AddressForm";

export default function AddressBook({ addresses, userName }) {
  const router = useRouter();
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const run = async (id, action, message) => {
    setBusyId(id);
    const result = await action(id);
    setBusyId(null);
    if (result.error) toast.error(result.error);
    else {
      toast.success(message);
      router.refresh();
    }
  };

  const close = () => setEditing(null);

  return (
    <>
      {addresses.length ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {addresses.map((a) => (
            <article key={a.id} className={`card p-5 flex flex-col ${a.isDefault ? "!border-accent/50" : ""}`}>
              <div className="flex items-center justify-between">
                <span className="badge">
                  <MapPin />
                  {a.label}
                </span>
                {a.isDefault && <span className="badge badge-accent">Default</span>}
              </div>
              <p className="mt-4 font-semibold">{a.name}</p>
              <p className="text-sm text-text-2">{a.street}</p>
              <p className="text-sm text-text-2">
                {a.city}, {a.state} {a.zip}
              </p>
              <p className="text-sm text-text-2">{a.country}</p>
              <p className="text-xs text-text-3 mt-1">{a.phone}</p>
              <div className="mt-auto pt-4 flex flex-wrap gap-1.5">
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(a)}>
                  <Pencil />
                  Edit
                </button>
                {!a.isDefault && (
                  <button className="btn btn-ghost btn-sm" disabled={busyId === a.id} onClick={() => run(a.id, setDefaultAddress, "Default address updated")}>
                    <Star />
                    Make default
                  </button>
                )}
                <button className="btn btn-ghost btn-sm !text-danger" disabled={busyId === a.id} onClick={() => run(a.id, deleteAddress, "Address removed")} aria-label={`Delete ${a.label} address`}>
                  <Trash2 />
                </button>
              </div>
            </article>
          ))}
          <button
            onClick={() => setEditing("new")}
            className="rounded-[12px] border border-dashed border-border-strong p-5 min-h-[200px] grid place-items-center text-sm text-text-2 hover:text-text hover:border-accent transition"
          >
            <span className="flex flex-col items-center gap-2">
              <Plus className="w-5 h-5" />
              Add an address
            </span>
          </button>
        </div>
      ) : (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          action={
            <button className="btn btn-primary" onClick={() => setEditing("new")}>
              <Plus />
              Add an address
            </button>
          }
        >
          Save your home or work address to check out faster.
        </EmptyState>
      )}

      <Modal open={Boolean(editing)} onClose={close} title={editing === "new" ? "New address" : "Edit address"} size="lg">
        {editing && (
          <AddressForm
            address={editing === "new" ? null : editing}
            defaultName={userName}
            onCancel={close}
            onSaved={() => {
              close();
              router.refresh();
            }}
          />
        )}
      </Modal>
    </>
  );
}
