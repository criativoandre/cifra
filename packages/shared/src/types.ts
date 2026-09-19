// Espelha exatamente o schema criado no Supabase (ver migrations do projeto "cifras").
// Qualquer mudança de coluna no banco precisa ser refletida aqui também.

export type Role = 'administrador' | 'editor' | 'colaborador';
export type CifraStatus = 'rascunho' | 'publicado';

export interface Organizacao {
  id: string;
  nome: string;
  created_at: string;
}

export interface Profile {
  id: string;
  organizacao_id: string;
  nome: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Repertorio {
  id: string;
  organizacao_id: string;
  nome: string;
  cor: string;
  liberado: boolean;
  created_by: string | null;
  created_at: string;
}

// Um bloco do conteúdo de uma cifra: ou é um marcador de seção, ou é um
// par acorde/letra (linha monoespaçada — a posição de cada caractere do
// acorde corresponde à coluna exata da letra logo abaixo).
export type CifraBlocoSecao = { type: 'section'; label: string };
export type CifraBlocoLinha = { type?: undefined; chords: string; lyric: string };
export type CifraBloco = CifraBlocoSecao | CifraBlocoLinha;

export interface Cifra {
  id: string;
  organizacao_id: string;
  titulo: string;
  cantor_ministerio: string;
  compositor: string | null;
  tom_original: string | null;
  afinacao: string | null;
  repertorio_id: string | null;
  arquivo_original_url: string | null;
  conteudo: CifraBloco[];
  tem_tablatura: boolean;
  tablatura: string | null;
  tem_batida: boolean;
  batida: string | null;
  status: CifraStatus;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

// Tipagem do schema "public" pro cliente do supabase-js (Database generic).
// Inclui os campos que o postgrest-js/supabase-js esperam na forma completa
// (Relationships, Views, Functions, Enums) — sem eles, o TypeScript não
// consegue inferir corretamente os tipos de insert/update e cai em "never".
export interface Database {
  public: {
    Tables: {
      organizacoes: {
        Row: Organizacao;
        Insert: Partial<Organizacao>;
        Update: Partial<Organizacao>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      repertorios: {
        Row: Repertorio;
        Insert: Partial<Repertorio>;
        Update: Partial<Repertorio>;
        Relationships: [];
      };
      cifras: {
        Row: Cifra;
        Insert: Partial<Cifra>;
        Update: Partial<Cifra>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
