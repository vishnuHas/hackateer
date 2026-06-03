# Setup Instructions: Configuring React, Tailwind CSS, & TypeScript

Because this workspace contains static HTML, CSS, and JS files, you will need to initialize a React runtime environment to run the `TravelCard` component and its associated TypeScript dependencies. Follow the step-by-step instructions below to configure the project.

---

## 🚀 Step 1: Initialize the React & TypeScript Project

You can choose either a **Next.js** framework or a **Vite** single-page app framework. Choose one of the setups below:

### Option A: Next.js (Recommended)
Run the following CLI script in this directory to initialize Next.js with Tailwind, TypeScript, and the `/src` tree:
```bash
npx create-next-app@latest ./ --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### Option B: Vite (Single-Page App)
Run the following script to scaffold a Vite runtime:
```bash
npm create vite@latest ./ -- --template react-ts
```

---

## 🛠️ Step 2: Configure Tailwind CSS 4

If you bootstrapped via **Next.js**, Tailwind is installed automatically. If you chose **Vite**, set up Tailwind 4 by running:
```bash
npm install tailwindcss @tailwindcss/vite
```

Then, configure the Vite plugin in `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
})
```

Add the Tailwind imports and the customized theme variables into your global stylesheet (e.g. `src/index.css` or `src/app/globals.css`). The variables and style rules have been created for you in [index.css](file:///g:/New%20folder%20(35)/index.css).

---

## 📦 Step 3: Install Core NPM Dependencies

Install the external libraries required by `TravelCard`, `Sonner`, `Alert`, and `Button`:
```bash
npm install lucide-react class-variance-authority sonner next-themes radix-ui clsx tailwind-merge @radix-ui/react-slot
```

---

## 🪐 Step 4: Initialize shadcn UI

To initialize the shadcn registry and configurations file (`components.json`), run:
```bash
npx shadcn@latest init
```

### Why the `/components/ui` Folder is Critical:
During the initialization, shadcn CLI creates a `components.json` mapping. By default, it sets components paths to `@/components` and UI primitives to `@/components/ui`.
- **Standardized Imports**: All shadcn command downloads (like `npx shadcn add button`) install directly into this path, making files importable via `import { Button } from "@/components/ui/button"`.
- **Decoupled Architecture**: Keeping core UI elements (like alerts, buttons, inputs) inside `/components/ui` separates visual primitives from application-specific feature blocks (like cards, lists, layout shells).

Ensure your `tsconfig.json` supports path mapping for compilation resolutions:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## 📝 Step 5: Placement of files

1. Copy the `TravelCard` file into `src/components/ui/card-7.tsx`
2. Copy the dependencies to:
   - `src/components/ui/button.tsx`
   - `src/components/ui/button-1.tsx`
   - `src/components/ui/sonner.tsx`
   - `src/components/ui/alert-1.tsx`
3. Copy `lib/utils.ts` to `src/lib/utils.ts`
4. Mount the demo component in your root entry file (e.g. `src/App.tsx` or `src/app/page.tsx` for Next.js):
   ```tsx
   import TravelCardDemo from "./demo";

   export default function App() {
     return <TravelCardDemo />;
   }
   ```
