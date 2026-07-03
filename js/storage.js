/* ===========================================================
   Savvio — Local storage adapter
   Every profile lives on this device first (works fully
   offline). js/cloud.js layers optional Google Sheets sync
   on top for cross-device continuity and parental controls.
   =========================================================== */

const SavvioStorage = (() => {
  const KEY = "savvio_v1";

  function _readAll() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { profiles: {}, activeId: null };
      return JSON.parse(raw);
    } catch (e) {
      console.error("Savvio storage read failed", e);
      return { profiles: {}, activeId: null };
    }
  }

  function _writeAll(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.error("Savvio storage write failed", e);
    }
  }

  return {
    listProfiles() {
      const data = _readAll();
      return Object.values(data.profiles);
    },

    getProfile(id) {
      const data = _readAll();
      return data.profiles[id] || null;
    },

    saveProfile(profile) {
      const data = _readAll();
      data.profiles[profile.id] = profile;
      _writeAll(data);
      return profile;
    },

    deleteProfile(id) {
      const data = _readAll();
      delete data.profiles[id];
      if (data.activeId === id) data.activeId = null;
      _writeAll(data);
    },

    getActiveProfileId() {
      return _readAll().activeId;
    },

    setActiveProfileId(id) {
      const data = _readAll();
      data.activeId = id;
      _writeAll(data);
    },
  };
})();

if (typeof window !== "undefined") window.SavvioStorage = SavvioStorage;
