# DailyGoals — App de Seguimiento de Hábitos y Metas

> **Materia:** Gestión de Proyectos de Software  
> **Institución:** Instituto Tecnológico de Tijuana  
> **Etapa:** II — Planificación del Proyecto y Prototipado  

---

## 📌 Descripción del Proyecto
DailyGoals es una aplicación móvil gamificada desarrollada para ayudar a los usuarios a construir y mantener hábitos diarios, un sistema de experiencia (XP) y niveles, y seguimiento de productividad en tiempo real.

---

## 👥 Integrantes del Equipo
* **Howard Rodríguez Gallardo** — Líder de Proyecto
* **Christopher Molina Cano** — Diseñador / Frontend
* **Irene Ramírez Bautista** — Backend / Lógica de Datos

---

## 🛠️ Stack Tecnológico y Arquitectura
* **Aplicación Móvil Principal:** React Native, Expo (SDK 51+), TypeScript, Tailwind CSS / NativeWind.
* **Prototipo Interactivo Web:** HTML5, CSS3, JavaScript Vanilla (ES6+).
* **Persistencia de Datos:** `localStorage` (Prototipo) / `AsyncStorage` (App Móvil).
* **Control de Versiones:** Git & GitHub.

---

## 📂 Estructura del Repositorio

```text
DailyGoals/
├── prototype/              # Prototipo web interactivo (HTML5/CSS3/JS)
│   ├── index.html          # Vista principal e interfaz del smartphone
│   ├── styles/             # Hojas de estilo (Diseño 3D e Índigo/Naranja)
│   └── js/                 # Módulos JS (Gamificación, CRUD, Storage)
├── src/                    # Código fuente principal en React Native
│   ├── app/                # Rutas y pantallas (Expo Router)
│   ├── components/         # Componentes reutilizables UI
│   ├── constants/          # Constantes de diseño y temas
│   ├── hooks/              # Custom Hooks de estado
│   └── global.css          # Estilos globales Tailwind
├── assets/                 # Recursos gráficos e íconos
├── app.json                # Configuración de Expo
├── package.json            # Dependencias del proyecto
└── README.md               # Documentación general
