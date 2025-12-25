"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Entry = {
  id: number;
  author_id: string;
  created_at: string;
  session_date: string;
  title: string;
  body: string;
};

export default function Home() {
  const r = useRouter();

  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  const [sessionDate, setSessionDate] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const loadEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("analysis_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    setLoading(false);
    if (error) return alert(error.message);
    setEntries((data as Entry[]) ?? []);
  };

  const loadProfiles = async () => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name");

  if (error) {
    alert(error.message);
    return;
  }

  const map: Record<string, string> = {};
  for (const p of data ?? []) {
    map[p.id] = p.display_name ?? "名無し";
  }

  setNameMap(map);
};


  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return r.push("/login");

      setUserId(user.id);
      setEmail(user.email ?? null);
      setReady(true);

      await loadEntries();
      await loadProfiles();
    })();
  }, [r]);

  const logout = async () => {
    await supabase.auth.signOut();
    r.push("/login");
  };

  const resetForm = () => {
    setSessionDate("");
    setTitle("");
    setBody("");
    setEditingId(null);
  };

  const submit = async () => {
    if (!userId) return;
    if (!sessionDate || !title || !body) {
      return alert("session_date / title / body を入力してください");
    }

    if (!isEditing) {
      const { error } = await supabase.from("analysis_entries").insert({
        author_id: userId,
        session_date: sessionDate,
        title,
        body,
      });
      if (error) return alert(error.message);
    } else {
      const { error } = await supabase
        .from("analysis_entries")
        .update({ session_date: sessionDate, title, body })
        .eq("id", editingId);
      if (error) return alert(error.message);
    }

    resetForm();
    await loadEntries();
  };

  const startEdit = (e: Entry) => {
    setEditingId(e.id);
    setSessionDate(e.session_date);
    setTitle(e.title);
    setBody(e.body);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteEntry = async (id: number) => {
    const ok = confirm("この投稿を削除しますか？");
    if (!ok) return;

    const { error } = await supabase.from("analysis_entries").delete().eq("id", id);
    if (error) return alert(error.message);

    if (editingId === id) resetForm();
    await loadEntries();
  };

  if (!ready) return null;

  return (
    <main style={{ padding: 16, maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>ラグビー分析</h1>
          <p>ログイン中: {email}</p>
        </div>
        <button onClick={logout}>ログアウト</button>
      </div>

      <hr />

      <h2>{isEditing ? "編集（ワンプレー）" : "新規投稿（ワンプレー）"}</h2>

      <div style={{ display: "grid", gap: 8 }}>
        <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} />
        <input placeholder="title（一覧の見出し）" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="body（自由記述）" value={body} onChange={(e) => setBody(e.target.value)} rows={6} />

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={submit}>{isEditing ? "更新" : "投稿"}</button>
          {isEditing && <button onClick={resetForm}>編集をやめる</button>}
        </div>
      </div>

      <hr />

      <h2>投稿一覧</h2>
      {loading && <p>読み込み中...</p>}

      <ul style={{ paddingLeft: 16 }}>
        {entries.map((e) => (
          <li key={e.id} style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700 }}>
              {e.session_date} / {e.title}
            </div>
	    <div style={{ fontSize: 12, opacity: 0.7 }}>
  投稿者: {nameMap[e.author_id] ?? "読み込み中..."}
</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{e.body}</div>

            {userId === e.author_id && (
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <button onClick={() => startEdit(e)}>編集</button>
                <button onClick={() => deleteEntry(e.id)}>削除</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
