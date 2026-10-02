import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Sin esto, cada test deja su render en pantalla y el siguiente ve botones duplicados.
afterEach(cleanup);
