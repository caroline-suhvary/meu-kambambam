"use client";

import { Leckerli_One } from "next/font/google";

// Fonte cursiva carregada pelo Next e servida junto com o site.
const fonteTitulo = Leckerli_One({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

import { useCallback, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Plus, RefreshCw } from "lucide-react";
import { browserClient } from "@/lib/browser";
import { request } from "@/features/boards";
import { signOut } from "@/features/auth";
import { inviteMember, acceptInvite, removeMember } from "@/features/groups";
import AuthForm from "@/components/AuthForm";
import KanbanBoard from "@/components/KanbanBoard";
import type { Board, Snapshot } from "@/types";
import "./styles.css";
const PUBLIC_ID = "00000000-0000-4000-8000-000000000001";
// PAI: guarda sessão, seleção e snapshot. Filhos recebem props e devolvem eventos.
export default function Kambambam() {
  const [user, setUser] = useState<User | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [invites, setInvites] = useState<Board[]>([]);
  const [selected, setSelected] = useState(PUBLIC_ID);
  const [state, setState] = useState<Snapshot | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await request<{ boards: Board[]; invites: Board[] }>("list");
      setBoards(list.boards);
      setInvites(list.invites);
      const id = list.boards.some((b) => b.id === selected)
        ? selected
        : PUBLIC_ID;
      setSelected(id);
      setState(await request<Snapshot>("snapshot", { board: id }));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }, [selected]);
  useEffect(() => {
    try {
      const client = browserClient();
      void client.auth.getUser().then(({ data }) => {
        setUser(data.user);
        setReady(true);
      });
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setReady(true);
      });
      return () => data.subscription.unsubscribe();
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (ready) void refresh();
  }, [ready, user?.id, refresh]);
  // Atualização periódica simples. Não promete presença ou edição simultânea em tempo real.
  useEffect(() => {
    if (!ready) return;
    const timer = setInterval(() => {
      if (!document.hidden) void refresh();
    }, 30_000);
    return () => clearInterval(timer);
  }, [ready, refresh]);
  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await fn();
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operação não concluída.");
    } finally {
      setBusy(false);
    }
  }
  async function create(kind: "individual" | "group") {
    const name = prompt("Nome do quadro");
    if (!name?.trim()) return;
    const email =
      kind === "group"
        ? prompt("E-mail de outra pessoa que já entrou no aplicativo")
        : undefined;
    if (kind === "group" && !email) return;
    await run(async () => {
      const board = await request<Board>("create_board", {
        title: name,
        kind,
        email,
      });
      setSelected(board.id);
    });
  }
  const mine =
    state?.attachments.filter((a) => a.owner_id === user?.id).length ?? 0;
  return (
    <main className="workspace">
      <header className="workspace-header">
        <div>
          <p className="eyebrow">QUADRO DE TAREFAS</p>
          <h1
            className={`${fonteTitulo.className} titulo-colorido`}
            aria-label="MEU KAMBAMBAM">
            {/* Cada letra recebe uma cor; os espaços são preservados. */}
            {"MEU KAMBAMBAM".split("").map((letra, indice) => (
              <span
                key={indice}
                className={`titulo-letra titulo-cor-${indice % 5}`}
                aria-hidden="true">
                {letra}
              </span>
            ))}
          </h1>
        </div>
        <div className="row">
          {user ? (
            <>
              <span>{user.user_metadata.name ?? "Minha conta"}</span>
              <button disabled={busy} onClick={() => void run(() => signOut())}>
                Sair
              </button>
            </>
          ) : (
            <button className="primary" onClick={() => setAuthOpen(true)}>
              Entrar / cadastrar
            </button>
          )}
        </div>
      </header>
      {authOpen && <AuthForm onClose={() => setAuthOpen(false)} />}
      {state?.board.kind === "public" && (
        <p className="notice">
          Demonstração compartilhada: qualquer visitante pode alterar e excluir
          tarefas e anexos de outras pessoas. Não envie informações pessoais.
          Até 5 anexos no quadro; 1 por tarefa; PDF, PNG e links. Arquivos até 1
          MB.
        </p>
      )}
      <div className="toolbar row">
        <label>
          Quadro
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}>
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </label>
        {user && (
          <>
            <button disabled={busy} onClick={() => void create("individual")}>
              Criar individual
            </button>
            <button disabled={busy} onClick={() => void create("group")}>
              Criar grupo
            </button>
          </>
        )}
        <button
          className="icon-button"
          title="Atualizar quadro"
          aria-label="Atualizar quadro"
          disabled={loading}
          onClick={() => void refresh()}>
          <RefreshCw />
        </button>
      </div>
      {invites.map((b) => (
        <div key={b.id} className="notice row">
          <span>Convite: {b.title}</span>
          <button
            disabled={busy}
            onClick={() => void run(() => acceptInvite(b.id))}>
            Aceitar
          </button>
        </div>
      ))}
      {error && (
        <div className="notice error" role="alert">
          {error}
          <button onClick={() => void refresh()}>Tentar novamente</button>
        </div>
      )}
      {loading && !state && <p role="status">Carregando tarefas…</p>}
      {state && (
        <>
          <div className="row board-summary">
            <h2>{state.board.title}</h2>
            <span>
              {state.attachments.length}/
              {state.board.kind === "public"
                ? 5
                : state.board.kind === "individual"
                  ? 5
                  : Math.min(
                      20,
                      state.members.filter((m) => m.status === "active")
                        .length * 5,
                    )}{" "}
              anexos{state.board.kind !== "public" ? ` · meus: ${mine}/5` : ""}
            </span>
          </div>
          {state.board.kind === "group" && (
            <section className="group-section">
              <div className="row">
                <h3>Participantes ({state.members.length}/4 vagas)</h3>
                {state.board.owner_id === user?.id && (
                  <button
                    disabled={busy}
                    onClick={() => {
                      const email = prompt(
                        "E-mail da pessoa que já entrou no aplicativo",
                      );
                      if (email) void run(() => inviteMember(selected, email));
                    }}>
                    Convidar
                  </button>
                )}
              </div>
              <ul>
                {state.members.map((m) => (
                  <li key={m.user_id}>
                    {m.name}
                    {m.status === "invited" ? " — convite pendente" : ""}
                    {state.board.owner_id === user?.id &&
                      m.user_id !== user.id && (
                        <button
                          disabled={busy}
                          onClick={() => {
                            if (
                              confirm(
                                "Remover esta pessoa? Os anexos dela precisam ser removidos antes.",
                              )
                            )
                              void run(() => removeMember(selected, m.user_id));
                          }}>
                          Remover
                        </button>
                      )}
                  </li>
                ))}
              </ul>
            </section>
          )}
          <form
            className="row new-card"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                await request("add_card", { board: selected, title });
                setTitle("");
              });
            }}>
            <input
              aria-label="Nova tarefa"
              placeholder="Nova tarefa"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              required
            />
            <button className="primary" disabled={busy}>
              <Plus size={15} /> Adicionar
            </button>
          </form>
          <KanbanBoard
            state={state}
            userId={user?.id ?? null}
            onChanged={() => void refresh()}
            onError={setError}
          />
        </>
      )}
      <footer className="workspace-footer">
        Protótipo de portfólio · Não envie documentos confidenciais.
      </footer>
    </main>
  );
}
