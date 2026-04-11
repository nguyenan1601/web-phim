"use client";

import { useState, useTransition } from "react";
import { updateProfileAction } from "@/app/actions/profile";
import { toast } from "sonner";
import { Save, User, Mail } from "lucide-react";

interface ProfileFormProps {
  profile: any;
  email: string;
}

export default function ProfileForm({ profile, email }: ProfileFormProps) {
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim()) {
      toast.error("Vui lòng nhập tên đầy đủ");
      return;
    }

    startTransition(async () => {
      const result = await updateProfileAction({ full_name: fullName });
      
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Cập nhật thông tin thành công!");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Email - Read Only */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-500 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Địa chỉ Email
          </label>
          <div className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-white/5 text-zinc-400 cursor-not-allowed">
            {email}
          </div>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <label htmlFor="full_name" className="text-sm text-zinc-500 flex items-center gap-2">
            <User className="w-4 h-4" />
            Tên đầy đủ / Biệt danh
          </label>
          <input
            id="full_name"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl bg-zinc-800/80 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-zinc-600"
            placeholder="Nhập tên của bạn..."
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-amber-500 text-black font-bold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
      >
        <Save className="w-4 h-4" />
        {isPending ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </form>
  );
}
