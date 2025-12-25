"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const r = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const signUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);

    // profiles に表示名を保存（あなたのRLS設計に合う）
    const userId = data.user?.id;
    if (userId) {
      const { error: e2 } = await supabase
        .from("profiles")
        .insert({ id: userId, display_name: displayName || "名無し" });

      if (e2) return alert(e2.message);
    }

    r.push("/");
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    r.push("/");
  };

  return (
    <main style={{ padding: 16, maxWidth: 520 }}>
      <h1>ログイン / 新規登録</h1>

      <div style={{ display: "grid", gap: 8 }}>
        <input
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          placeholder="表示名（新規登録時）"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button onClick={signIn}>ログイン</button>
        <button onClick={signUp}>新規登録</button>
      </div>
    </main>
  );
}
