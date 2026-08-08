# Asistente IA y modos

## Para qué sirve el asistente

Ayuda a entender conceptos y flujos de la app (no consulta la base de items/maestros de negocio).

## Sin API key (gratis / open source)

Si no hay API key de pago:
1. Se usa **Ollama local** (`http://127.0.0.1:11434`) con el mejor modelo open source instalado.
2. Preferencia de modelos “pensantes”: DeepSeek-R1, luego QwQ / Qwen3 / Llama, etc.
3. Si Ollama no está, responde con **RAG local** (markdowns de ayuda) sin LLM externo.

Comando típico: `ollama pull deepseek-r1`

## Conexiones

En **Mantenimiento IA** (`/ai-settings`) se cargan una o varias conexiones.
Solo una está **activa** para el chat.
Hay un botón **Usar modelo open source gratis** que activa el preset Ollama.

## Modos

- **Fundacional:** responde solo con el modelo LLM (API compatible OpenAI).
- **Fundacional + RAG:** el backend busca fragmentos en la base de conocimiento local de la app y se los pasa al modelo.
