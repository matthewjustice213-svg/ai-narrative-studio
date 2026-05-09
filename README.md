# AI Narrative Studio

Electron desktop MVP for canvas-first story mapping and AI Writers Room feedback.

## Development

```powershell
npm install
npm run dev:electron
```

## MVP Workflow

1. Open the Electron app.
2. Confirm the story graph canvas renders with scene and character nodes.
3. Select a scene node.
4. Edit the scene title, summary, tone, runtime estimate, beat notes, and screenplay text.
5. Connect scenes on the canvas.
6. Import a structured `soul.md` through the persona import button.
7. Toggle persona visibility.
8. Enter an OpenAI API key in the AI Dock key field.
9. Ask the visible Writers Room for scene notes.
10. Reopen the project folder and confirm graph data and AI notes persist.

## Verification

```powershell
npm run typecheck
npm run test
npm run build
```

## Sample Persona

See `samples/writers-room/awkward-comedy-doctor.soul.md`.
