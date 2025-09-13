-- Migração para adicionar tabela de análises de NCM

CREATE TABLE IF NOT EXISTS public.ncm_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    analysis_name VARCHAR(255),
    analysis_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ncm_analyses_user_id ON public.ncm_analyses(user_id);
CREATE INDEX idx_ncm_analyses_created_at ON public.ncm_analyses(created_at);

ALTER TABLE public.ncm_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own analyses" ON public.ncm_analyses
    FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_ncm_analyses_updated_at 
    BEFORE UPDATE ON public.ncm_analyses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Tabela para base oficial de NCM RFB
CREATE TABLE IF NOT EXISTS public.ncm_official (
    codigo VARCHAR(20) PRIMARY KEY,
    descricao TEXT NOT NULL,
    data_inicio DATE,
    data_fim DATE,
    tipo_ato VARCHAR(50)
);

CREATE INDEX idx_ncm_official_codigo ON public.ncm_official(codigo);

ALTER TABLE public.ncm_official ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for NCM official" ON public.ncm_official
    FOR SELECT USING (true);


-- Tabela para sugestões de reclasificação NCM
CREATE TABLE IF NOT EXISTS public.ncm_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    current_ncm VARCHAR(20) NOT NULL,
    suggested_ncm VARCHAR(20) NOT NULL,
    description TEXT,
    current_rate DECIMAL(5,2),
    suggested_rate DECIMAL(5,2),
    confidence VARCHAR(50),
    caselaw TEXT,
    category VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ncm_suggestions_current ON public.ncm_suggestions(current_ncm);

ALTER TABLE public.ncm_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for suggestions" ON public.ncm_suggestions
    FOR SELECT USING (true);