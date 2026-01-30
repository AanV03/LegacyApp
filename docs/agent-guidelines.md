# Agent Guidelines — Paleta y reglas de accesibilidad

Propósito
- Archivo de referencia para que el agente/colaborador tenga siempre presente la paleta de colores aprobada, resultados de contraste y reglas de uso antes de cambiar diseño o CSS.

Ubicación de variables
- Archivo principal: `src/styles/globals.css`
- Las variables semánticas (ej.: `--background`, `--foreground`, `--primary`, `--secondary`, etc.) se mantienen allí y son la fuente de verdad.

Paleta aprobada (resumen)

Light
- `--background`: #F8FAFC
- `--surface` / `--card`: #FFFFFF
- `--foreground`: #0F172A
- `--text-secondary`: #475569
- `--primary`: #2563EB (hover: #1D4ED8, active: #1E40AF)
- `--secondary`: #7C3AED (hover: #6D28D9)
- `--accent`: #059669
- `--destructive`: #DC2626
- `--border`: #CBD5E1

Dark
- `--background`: #0B1220
- `--surface` / `--card`: #0F1724
- `--foreground`: #F8FAFC
- `--primary`: #60A5FA (hover: #3B82F6, active: #2563EB)
- `--secondary`: #C4B5FD (hover: #A78BFA)
- `--accent`: #34D399
- `--destructive`: #F87171
- `--border`: #1F2A37

Resultados de contraste (básico, generado por tools/contrast_check.py)
- background / foreground (light): 17.06 — AA: PASS
- primary / primary-foreground (light): 5.17 — AA: PASS (AAA: FAIL)
- secondary / secondary-foreground (light): 5.70 — AA: PASS
- accent / accent-foreground (light): 3.77 — AA: FAIL (solo para texto grande)
- destructive / white (light): 4.83 — AA: PASS
- background / foreground (dark): 17.89 — AA: PASS
- primary / primary-foreground (dark): 7.23 — AA & AAA: PASS
- secondary / secondary-foreground (dark): 9.96 — AA & AAA: PASS
- accent / accent-foreground (dark): 9.56 — AA & AAA: PASS

Reglas / restricciones (obligatorias)
- No sustituir `--foreground` / `--background` sin aprobarlo explícitamente con el dueño del proyecto.
- `--accent` en modo light NO debe usarse para texto pequeño normal; solo para iconos, badges, fondos grandes o texto grande. Si se necesita texto sobre `--accent`, ajustar a un tono más oscuro (`#047857` o similar) y re-evaluar contraste.
- Siempre ofrecer alternativa no visual (iconos/texto) para estados (error, success, info). No usar color solo.
- Gradientes azules→morados deben ser decorativos: mantener opacidad baja y colocar formularios/textos críticos dentro de una tarjeta sólida (`.login-card`) para garantizar contraste.
- Antes de cualquier cambio de color, ejecutar `tools/contrast_check.py` y reportar ratios (AA/AAA) en la PR o en el commit message.

Clases útiles añadidas
- `.login-bg` — gradiente decorativo (usar como contenedor). Variable: `--grad-top`, `--grad-mid`, `--grad-bottom`.
- `.login-card` — tarjeta sólida para formularios y texto importante.

Proceso recomendado del agente cuando reciba requests sobre UI/colores
1. Leer este archivo (`docs/agent-guidelines.md`) y `src/styles/globals.css`.
2. Ejecutar `python tools/contrast_check.py` para verificar contrastes actuales.
3. Si propone cambios en la paleta, calcular impacto (pares text/background) y presentar alternativas con ratios.
4. Nunca modificar la paleta en `globals.css` sin confirmación explícita del usuario; en su lugar, proponer un parche y esperar OK.

Cómo usar este archivo
- Está pensado como la "fuente de verdad" para decisiones rápidas de color y accesibilidad.
- Si se actualiza la paleta en `src/styles/globals.css`, actualizar también este archivo con nuevo resumen y resultados.

Contacto / notas
- Autor: equipo de diseño / desarrollador (proyecto).
- Script de verificación: `tools/contrast_check.py` (ejecutar localmente para obtener ratios).

--
Generado: 2026-01-23

## Integración con Tailwind

Recomendación: mapear las variables semánticas definidas en `src/styles/globals.css` dentro de `tailwind.config.js` para usar clases como `bg-primary` o `text-primary-foreground` en lugar de colores codificados.

Ejemplo mínimo para `tailwind.config.js`:

```js
module.exports = {
	theme: {
		extend: {
			colors: {
				primary: 'var(--primary)',
				'primary-foreground': 'var(--primary-foreground)',
				secondary: 'var(--secondary)',
				'secondary-foreground': 'var(--secondary-foreground)',
				accent: 'var(--accent)',
				destructive: 'var(--destructive)'
			}
		}
	}
}
```

Notas:
- Para casos puntuales puedes usar clases arbitrarias: `bg-[color:var(--primary)]`.
- Asegúrate de no usar hex rígidos en componentes; preferir siempre `var(...)` o las keys mapeadas en Tailwind.
- Al cambiar variables en `globals.css`, ejecutar `tools/contrast_check.py` y actualizar este documento.
