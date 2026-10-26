"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { createRider } from "@/actions/admin";
import Modal from "@/components/ui/Modal";

export default function AddRider() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const result = await createRider(Object.fromEntries(new FormData(e.currentTarget)));
    setBusy(false);
    if (result.error) return toast.error(result.error);
    toast.success("Rider added. They can log in and go online.");
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        <UserPlus />
        Add rider
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add a rider" description="They'll sign in with this email and password and see the rider app.">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="r-name">
                Name
              </label>
              <input id="r-name" name="name" className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="r-phone">
                Phone
              </label>
              <input id="r-phone" name="phone" type="tel" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="r-email">
                Email
              </label>
              <input id="r-email" name="email" type="email" className="input" required />
            </div>
            <div>
              <label className="label" htmlFor="r-password">
                Temporary password
              </label>
              <input id="r-password" name="password" type="text" className="input" minLength={8} required />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="r-vehicle">
              Vehicle
            </label>
            <select id="r-vehicle" name="vehicle" className="select" defaultValue="Bicycle">
              <option>Bicycle</option>
              <option>Electric scooter</option>
              <option>Motorbike</option>
              <option>Car</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" disabled={busy}>
              {busy && <span className="spinner" />}
              Add rider
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
