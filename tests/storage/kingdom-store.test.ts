import { beforeEach, describe, expect, it } from "vitest";
import { createKingdomDemoState } from "@/lib/demo/kingdom";
import { totalWealth } from "@/lib/finance/kingdom";
import {
  EMPTY_KINGDOM_STATE,
  KINGDOM_EXPORT_SCHEMA_VERSION,
  parseKingdomToolState,
  useKingdomStore,
} from "@/lib/storage/kingdom-store";

const STORAGE_KEY = "finplan:kingdom:v1";

function freshState() {
  useKingdomStore.setState({ ...EMPTY_KINGDOM_STATE });
}

beforeEach(() => {
  localStorage.clear();
  freshState();
});

describe("kingdom store actions", () => {
  it("starts empty", () => {
    expect(useKingdomStore.getState().buildings).toEqual([]);
    expect(useKingdomStore.getState().deposits).toEqual([]);
    expect(useKingdomStore.getState().kingdomName).toBe("My Kingdom");
  });

  it("sets kingdom name", () => {
    useKingdomStore.getState().setKingdomName("My Realm");
    expect(useKingdomStore.getState().kingdomName).toBe("My Realm");
  });

  it("falls back to default name for empty string", () => {
    useKingdomStore.getState().setKingdomName("");
    expect(useKingdomStore.getState().kingdomName).toBe("My Kingdom");
  });

  it("adds buildings with zero currentAmount", () => {
    useKingdomStore.getState().addBuilding({
      name: "Emergency Fund",
      icon: "castle",
      targetAmount: 1000,
      color: "emerald",
    });
    const buildings = useKingdomStore.getState().buildings;
    expect(buildings).toHaveLength(1);
    expect(buildings[0].name).toBe("Emergency Fund");
    expect(buildings[0].currentAmount).toBe(0);
    expect(buildings[0].targetAmount).toBe(1000);
  });

  it("rejects buildings with invalid data", () => {
    useKingdomStore.getState().addBuilding({
      name: "",
      icon: "castle",
      targetAmount: 1000,
      color: "emerald",
    });
    expect(useKingdomStore.getState().buildings).toHaveLength(0);

    useKingdomStore.getState().addBuilding({
      name: "Valid",
      icon: "castle",
      targetAmount: -100,
      color: "emerald",
    });
    expect(useKingdomStore.getState().buildings).toHaveLength(0);
  });

  it("limits to 12 buildings", () => {
    for (let i = 0; i < 12; i++) {
      useKingdomStore.getState().addBuilding({
        name: `Building ${i}`,
        icon: "castle",
        targetAmount: 100,
        color: "emerald",
      });
    }
    expect(useKingdomStore.getState().buildings).toHaveLength(12);

    const result = useKingdomStore.getState().addBuilding({
      name: "Too many",
      icon: "castle",
      targetAmount: 100,
      color: "emerald",
    });
    expect(result).toBe("");
    expect(useKingdomStore.getState().buildings).toHaveLength(12);
  });

  it("updates buildings", () => {
    useKingdomStore.getState().addBuilding({
      name: "Old Name",
      icon: "castle",
      targetAmount: 500,
      color: "emerald",
    });
    const id = useKingdomStore.getState().buildings[0].id;
    useKingdomStore.getState().updateBuilding(id, {
      name: "New Name",
      targetAmount: 1000,
    });
    expect(useKingdomStore.getState().buildings[0].name).toBe("New Name");
    expect(useKingdomStore.getState().buildings[0].targetAmount).toBe(1000);
  });

  it("removes buildings and their deposits", () => {
    useKingdomStore.getState().addBuilding({
      name: "Test",
      icon: "castle",
      targetAmount: 1000,
      color: "emerald",
    });
    const buildingId = useKingdomStore.getState().buildings[0].id;
    useKingdomStore.getState().addDeposit({
      buildingId,
      amount: 100,
      date: "2026-06-01",
      note: "",
    });
    expect(useKingdomStore.getState().deposits).toHaveLength(1);

    useKingdomStore.getState().removeBuilding(buildingId);
    expect(useKingdomStore.getState().buildings).toHaveLength(0);
    expect(useKingdomStore.getState().deposits).toHaveLength(0);
  });

  it("adds deposits and increases currentAmount", () => {
    useKingdomStore.getState().addBuilding({
      name: "Fund",
      icon: "castle",
      targetAmount: 1000,
      color: "emerald",
    });
    const buildingId = useKingdomStore.getState().buildings[0].id;

    useKingdomStore.getState().addDeposit({
      buildingId,
      amount: 250,
      date: "2026-06-01",
      note: "First deposit",
    });

    expect(useKingdomStore.getState().deposits).toHaveLength(1);
    expect(useKingdomStore.getState().buildings[0].currentAmount).toBe(250);
  });

  it("caps deposit at remaining target", () => {
    useKingdomStore.getState().addBuilding({
      name: "Small Fund",
      icon: "castle",
      targetAmount: 100,
      color: "emerald",
    });
    const buildingId = useKingdomStore.getState().buildings[0].id;

    useKingdomStore.getState().addDeposit({
      buildingId,
      amount: 50,
      date: "2026-06-01",
      note: "",
    });
    useKingdomStore.getState().addDeposit({
      buildingId,
      amount: 999,
      date: "2026-06-02",
      note: "",
    });

    expect(useKingdomStore.getState().buildings[0].currentAmount).toBe(100);
    expect(useKingdomStore.getState().deposits).toHaveLength(2);
    expect(useKingdomStore.getState().deposits[1].amount).toBe(50);
  });

  it("rejects deposits with invalid data", () => {
    useKingdomStore.getState().addBuilding({
      name: "Fund",
      icon: "castle",
      targetAmount: 1000,
      color: "emerald",
    });

    useKingdomStore.getState().addDeposit({
      buildingId: "nonexistent",
      amount: 100,
      date: "2026-06-01",
      note: "",
    });
    expect(useKingdomStore.getState().deposits).toHaveLength(0);

    useKingdomStore.getState().addDeposit({
      buildingId: useKingdomStore.getState().buildings[0].id,
      amount: -50,
      date: "2026-06-01",
      note: "",
    });
    expect(useKingdomStore.getState().deposits).toHaveLength(0);
  });

  it("removes deposits and decreases currentAmount", () => {
    useKingdomStore.getState().addBuilding({
      name: "Fund",
      icon: "castle",
      targetAmount: 1000,
      color: "emerald",
    });
    const buildingId = useKingdomStore.getState().buildings[0].id;

    useKingdomStore.getState().addDeposit({
      buildingId,
      amount: 200,
      date: "2026-06-01",
      note: "",
    });
    const depositId = useKingdomStore.getState().deposits[0].id;
    expect(useKingdomStore.getState().buildings[0].currentAmount).toBe(200);

    useKingdomStore.getState().removeDeposit(depositId);
    expect(useKingdomStore.getState().deposits).toHaveLength(0);
    expect(useKingdomStore.getState().buildings[0].currentAmount).toBe(0);
  });

  it("resets to empty state", () => {
    useKingdomStore.getState().addBuilding({
      name: "Test",
      icon: "castle",
      targetAmount: 100,
      color: "emerald",
    });
    useKingdomStore.getState().reset();
    expect(useKingdomStore.getState()).toMatchObject(EMPTY_KINGDOM_STATE);
  });

  it("persists to localStorage", () => {
    useKingdomStore.getState().addBuilding({
      name: "Persisted",
      icon: "castle",
      targetAmount: 500,
      color: "emerald",
    });
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    expect(persisted.state.buildings).toHaveLength(1);
    expect(persisted.version).toBe(1);
  });

  it("updates achievements when state changes", () => {
    useKingdomStore.getState().addBuilding({
      name: "Fund",
      icon: "castle",
      targetAmount: 100,
      color: "emerald",
    });
    const achs = useKingdomStore.getState().achievements;
    const firstBuilding = achs.find((a) => a.id === "first_building");
    expect(firstBuilding?.unlockedAt).not.toBeNull();
  });
});

describe("replaceAll (import path)", () => {
  it("replaces state wholesale after structural validation", () => {
    useKingdomStore.getState().addBuilding({
      name: "Old",
      icon: "castle",
      targetAmount: 100,
      color: "emerald",
    });
    useKingdomStore.getState().replaceAll(createKingdomDemoState());

    const state = useKingdomStore.getState();
    expect(state.kingdomName).toBe("Demo Kingdom");
    expect(state.buildings).toHaveLength(5);
    expect(state.deposits.length).toBeGreaterThan(0);
    expect(state.achievements).toHaveLength(8);
  });

  it("rejects malformed payloads without touching current state", () => {
    useKingdomStore.getState().addBuilding({
      name: "Keep",
      icon: "castle",
      targetAmount: 100,
      color: "emerald",
    });

    expect(() => useKingdomStore.getState().replaceAll(null)).toThrow(TypeError);
    expect(() => useKingdomStore.getState().replaceAll({})).toThrow(TypeError);
    expect(() =>
      useKingdomStore.getState().replaceAll({ buildings: "nope" })
    ).toThrow(TypeError);

    expect(useKingdomStore.getState().buildings).toHaveLength(1);
  });
});

describe("parseKingdomToolState", () => {
  it("accepts a minimal valid payload", () => {
    const parsed = parseKingdomToolState({
      kingdomName: "Test",
      buildings: [],
      deposits: [],
      achievements: [],
    });
    expect(parsed.kingdomName).toBe("Test");
  });

  it("defaults kingdomName for non-string values", () => {
    const parsed = parseKingdomToolState({
      buildings: [],
      deposits: [],
      achievements: [],
    });
    expect(parsed.kingdomName).toBe("My Kingdom");
  });

  it("exposes the export schema version", () => {
    expect(KINGDOM_EXPORT_SCHEMA_VERSION).toBe(1);
  });
});

describe("demo seed", () => {
  it("is structurally valid", () => {
    const demo = createKingdomDemoState();
    const parsed = parseKingdomToolState(demo);

    expect(parsed.kingdomName).toBe("Demo Kingdom");
    expect(parsed.buildings).toHaveLength(5);
    expect(parsed.deposits.length).toBeGreaterThan(0);
    expect(parsed.achievements).toHaveLength(8);

    for (const building of parsed.buildings) {
      expect(building.targetAmount).toBeGreaterThan(0);
      expect(building.currentAmount).toBeGreaterThanOrEqual(0);
      expect(building.currentAmount).toBeLessThanOrEqual(building.targetAmount + 1e-9);
    }

    const wealth = totalWealth(parsed.buildings);
    expect(wealth).toBeGreaterThan(0);
  });
});
