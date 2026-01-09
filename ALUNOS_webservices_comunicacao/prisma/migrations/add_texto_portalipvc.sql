-- Adicionar coluna texto_portalipvc à tabela pn_noticia e inserir Portal IPVC como rede social
-- Data: 2025-01-XX

USE [ONIPVC]
GO

-- 1. Adicionar coluna texto_portalipvc à tabela pn_noticia
IF NOT EXISTS (
    SELECT 1 
    FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.pn_noticia') 
    AND name = 'texto_portalipvc'
)
BEGIN
    ALTER TABLE [dbo].[pn_noticia]
    ADD [texto_portalipvc] [text] NULL;
    
    PRINT 'Coluna texto_portalipvc adicionada com sucesso à tabela pn_noticia';
END
ELSE
BEGIN
    PRINT 'Coluna texto_portalipvc já existe na tabela pn_noticia';
END
GO

-- 2. Inserir Portal IPVC na tabela pn_redes_sociais se não existir
IF NOT EXISTS (
    SELECT 1 
    FROM [dbo].[pn_redes_sociais]
    WHERE nome = 'Portal IPVC'
)
BEGIN
    INSERT INTO [dbo].[pn_redes_sociais] ([id_rede_social], [nome])
    VALUES (NEWID(), 'Portal IPVC');
    
    PRINT 'Portal IPVC adicionado com sucesso à tabela pn_redes_sociais';
END
ELSE
BEGIN
    PRINT 'Portal IPVC já existe na tabela pn_redes_sociais';
END
GO

