import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function TestSupabasePage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  // Lưu ý: Trang này chỉ dành cho mục đích kiểm tra kết nối.
  // Bạn cần tạo bảng 'todos' trong Supabase hoặc thay đổi query bên dưới.
  const { data: todos, error } = await supabase.from('todos').select()

  return (
    <div className="container mx-auto px-4 pt-24 pb-16">
      <h1 className="text-2xl font-bold mb-4">Kiểm tra kết nối Supabase</h1>
      
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl mb-4">
          Lỗi: {error.message}
          <p className="text-sm mt-1 text-zinc-500">(Gợi ý: Bạn có thể chưa tạo bảng 'todos' hoặc cấu hình RLS chưa đúng)</p>
        </div>
      )}

      {!error && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl mb-4">
          Kết nối Supabase thành công!
        </div>
      )}

      <ul className="space-y-2">
        {todos?.map((todo: any) => (
          <li key={todo.id} className="p-3 bg-zinc-900 border border-white/5 rounded-lg">
            {todo.name}
          </li>
        ))}
        {todos?.length === 0 && (
          <li className="text-zinc-500 italic">Bảng 'todos' hiện đang trống.</li>
        )}
      </ul>

      <div className="mt-8 p-4 bg-zinc-900/50 rounded-2xl border border-white/10">
        <h2 className="text-lg font-semibold mb-2">Lưu ý quan trọng:</h2>
        <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
          <li>Tôi đã thiết lập các bảng <code>favorites</code> và <code>watch_history</code> theo yêu cầu trước đó.</li>
          <li>Vui lòng chạy file <code>database_setup.sql</code> trong Supabase SQL Editor.</li>
          <li>Trang này hiện đang test bảng <code>todos</code> theo code mẫu bạn cung cấp.</li>
        </ul>
      </div>
    </div>
  )
}
