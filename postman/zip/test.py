"""
obs_hide_inject.py — version corrigée sans bug de double curseur
================================================================
- Cache la fenêtre à OBS avec SetWindowDisplayAffinity
- Retire la fenêtre de la barre des tâches via ITaskbarList COM
- F8 : minimise / restaure la fenêtre cible
- `  : minimise / restaure la console
- PageUp/PageDown : scroll la fenêtre cachée
- Fix souris supprimé pour éviter le bug du double curseur

Lance en Administrateur.
"""

import ctypes
import ctypes.wintypes
import argparse
import struct
import threading
import time


# ── Constantes ────────────────────────────────────────────────────────────────

WDA_NONE               = 0x00000000
WDA_MONITOR            = 0x00000001
WDA_EXCLUDEFROMCAPTURE = 0x00000011

PROCESS_ALL_ACCESS     = 0x1F0FFF
MEM_COMMIT_RESERVE     = 0x3000
MEM_RELEASE            = 0x8000
PAGE_EXECUTE_READWRITE = 0x40

SW_MINIMIZE            = 6
SW_RESTORE             = 9
SW_SHOW                = 5

GWL_EXSTYLE            = -20
WS_EX_TOOLWINDOW       = 0x00000080
WS_EX_APPWINDOW        = 0x00040000

VK_F8                  = 0x77
VK_OEM_3               = 0xC0

WH_KEYBOARD_LL         = 13
WM_KEYDOWN             = 0x0100
WM_SYSKEYDOWN          = 0x0104

VK_PRIOR               = 0x21
VK_NEXT                = 0x22

WM_MOUSEWHEEL          = 0x020A
WHEEL_DELTA            = 120


# ── WinAPI ────────────────────────────────────────────────────────────────────

kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
user32   = ctypes.WinDLL("user32",   use_last_error=True)
ole32    = ctypes.WinDLL("ole32",    use_last_error=True)

LPVOID = ctypes.c_void_p
SIZE_T = ctypes.c_size_t
HANDLE = ctypes.c_void_p

kernel32.GetCurrentProcessId.restype     = ctypes.wintypes.DWORD
kernel32.OpenProcess.restype             = HANDLE
kernel32.OpenProcess.argtypes            = [
    ctypes.wintypes.DWORD,
    ctypes.wintypes.BOOL,
    ctypes.wintypes.DWORD
]
kernel32.VirtualAllocEx.restype          = LPVOID
kernel32.VirtualAllocEx.argtypes         = [
    HANDLE,
    LPVOID,
    SIZE_T,
    ctypes.wintypes.DWORD,
    ctypes.wintypes.DWORD
]
kernel32.WriteProcessMemory.restype      = ctypes.wintypes.BOOL
kernel32.WriteProcessMemory.argtypes     = [
    HANDLE,
    LPVOID,
    ctypes.c_char_p,
    SIZE_T,
    ctypes.POINTER(SIZE_T)
]
kernel32.CreateRemoteThread.restype      = HANDLE
kernel32.CreateRemoteThread.argtypes     = [
    HANDLE,
    LPVOID,
    SIZE_T,
    LPVOID,
    LPVOID,
    ctypes.wintypes.DWORD,
    ctypes.wintypes.LPDWORD
]
kernel32.WaitForSingleObject.restype     = ctypes.wintypes.DWORD
kernel32.WaitForSingleObject.argtypes    = [
    HANDLE,
    ctypes.wintypes.DWORD
]
kernel32.VirtualFreeEx.restype           = ctypes.wintypes.BOOL
kernel32.VirtualFreeEx.argtypes          = [
    HANDLE,
    LPVOID,
    SIZE_T,
    ctypes.wintypes.DWORD
]
kernel32.CloseHandle.restype             = ctypes.wintypes.BOOL
kernel32.CloseHandle.argtypes            = [HANDLE]
kernel32.GetProcAddress.restype          = LPVOID
kernel32.GetProcAddress.argtypes         = [
    LPVOID,
    ctypes.c_char_p
]
kernel32.GetModuleHandleW.restype        = LPVOID
kernel32.GetModuleHandleW.argtypes       = [ctypes.c_wchar_p]
kernel32.GetConsoleWindow.restype        = ctypes.wintypes.HWND

user32.EnumWindows.restype               = ctypes.wintypes.BOOL
user32.IsWindowVisible.restype           = ctypes.wintypes.BOOL
user32.GetWindowTextLengthW.restype      = ctypes.c_int
user32.GetWindowTextW.restype            = ctypes.c_int
user32.GetWindowThreadProcessId.restype  = ctypes.wintypes.DWORD

user32.SetWindowDisplayAffinity.restype  = ctypes.wintypes.BOOL
user32.SetWindowDisplayAffinity.argtypes = [
    ctypes.wintypes.HWND,
    ctypes.wintypes.DWORD
]

user32.ShowWindow.restype                = ctypes.wintypes.BOOL
user32.ShowWindow.argtypes               = [
    ctypes.wintypes.HWND,
    ctypes.c_int
]

user32.IsIconic.restype                  = ctypes.wintypes.BOOL
user32.IsIconic.argtypes                 = [ctypes.wintypes.HWND]

user32.GetWindowLongW.restype            = ctypes.c_long
user32.GetWindowLongW.argtypes           = [
    ctypes.wintypes.HWND,
    ctypes.c_int
]

user32.SetWindowLongW.restype            = ctypes.c_long
user32.SetWindowLongW.argtypes           = [
    ctypes.wintypes.HWND,
    ctypes.c_int,
    ctypes.c_long
]

user32.SetWindowPos.restype              = ctypes.wintypes.BOOL

user32.GetWindowRect.restype             = ctypes.wintypes.BOOL
user32.GetWindowRect.argtypes            = [
    ctypes.wintypes.HWND,
    ctypes.POINTER(ctypes.wintypes.RECT)
]

user32.SetWindowsHookExW.restype         = HANDLE
user32.SetWindowsHookExW.argtypes        = [
    ctypes.c_int,
    LPVOID,
    HANDLE,
    ctypes.wintypes.DWORD
]

user32.CallNextHookEx.restype            = ctypes.c_long
user32.CallNextHookEx.argtypes           = [
    HANDLE,
    ctypes.c_int,
    ctypes.wintypes.WPARAM,
    ctypes.wintypes.LPARAM
]

user32.UnhookWindowsHookEx.restype       = ctypes.wintypes.BOOL
user32.UnhookWindowsHookEx.argtypes      = [HANDLE]

user32.GetMessageW.restype               = ctypes.wintypes.BOOL
user32.TranslateMessage.restype          = ctypes.wintypes.BOOL
user32.DispatchMessageW.restype          = ctypes.c_long

user32.PostMessageW.restype              = ctypes.wintypes.BOOL
user32.PostMessageW.argtypes             = [
    ctypes.wintypes.HWND,
    ctypes.c_uint,
    ctypes.wintypes.WPARAM,
    ctypes.wintypes.LPARAM
]


# ── Structures ────────────────────────────────────────────────────────────────

class KBDLLHOOKSTRUCT(ctypes.Structure):
    _fields_ = [
        ("vkCode",      ctypes.wintypes.DWORD),
        ("scanCode",    ctypes.wintypes.DWORD),
        ("flags",       ctypes.wintypes.DWORD),
        ("time",        ctypes.wintypes.DWORD),
        ("dwExtraInfo", ctypes.POINTER(ctypes.c_ulong)),
    ]


# ── Utilitaires fenêtres ──────────────────────────────────────────────────────

def list_visible_windows():
    windows = []

    EnumProc = ctypes.WINFUNCTYPE(
        ctypes.wintypes.BOOL,
        ctypes.wintypes.HWND,
        ctypes.wintypes.LPARAM
    )

    @EnumProc
    def cb(hwnd, _):
        if user32.IsWindowVisible(hwnd):
            n = user32.GetWindowTextLengthW(hwnd)
            if n > 0:
                buf = ctypes.create_unicode_buffer(n + 1)
                user32.GetWindowTextW(hwnd, buf, n + 1)

                title = buf.value.strip()

                if title:
                    pid = ctypes.wintypes.DWORD(0)
                    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
                    windows.append((hwnd, title, pid.value))

        return True

    user32.EnumWindows(cb, 0)
    return windows


def find_window(partial):
    q = partial.lower()
    return [
        (h, t, p)
        for h, t, p in list_visible_windows()
        if q in t.lower()
    ]


def is_admin():
    try:
        return bool(ctypes.windll.shell32.IsUserAnAdmin())
    except Exception:
        return False


def get_window_rect(hwnd):
    r = ctypes.wintypes.RECT()

    if user32.GetWindowRect(hwnd, ctypes.byref(r)):
        return (r.left, r.top, r.right, r.bottom)

    return None


# ── Injection shellcode x64 ───────────────────────────────────────────────────

def apply_affinity_remote(hwnd: int, pid: int, affinity: int) -> bool:
    h_user32 = kernel32.GetModuleHandleW("user32.dll")

    if not h_user32:
        return False

    fn_addr = kernel32.GetProcAddress(h_user32, b"SetWindowDisplayAffinity")

    if not fn_addr:
        return False

    sc = (
        b"\x48\xB9" + struct.pack("<Q", hwnd & 0xFFFFFFFFFFFFFFFF) +
        b"\xBA"     + struct.pack("<I", affinity) +
        b"\x48\xB8" + struct.pack("<Q", fn_addr & 0xFFFFFFFFFFFFFFFF) +
        b"\xFF\xD0" +
        b"\xC3"
    )

    h_proc = kernel32.OpenProcess(PROCESS_ALL_ACCESS, False, pid)

    if not h_proc:
        err = ctypes.get_last_error()
        print(f"[ERREUR] OpenProcess PID={pid} échoué. Code : {err}")

        if err == 5:
            print("         → Lance le script en tant qu'Administrateur.")

        return False

    success = False
    remote_mem = None
    h_thread = None

    try:
        remote_mem = kernel32.VirtualAllocEx(
            h_proc,
            None,
            len(sc),
            MEM_COMMIT_RESERVE,
            PAGE_EXECUTE_READWRITE
        )

        if not remote_mem:
            return False

        written = SIZE_T(0)

        ok_write = kernel32.WriteProcessMemory(
            h_proc,
            remote_mem,
            sc,
            len(sc),
            ctypes.byref(written)
        )

        if not ok_write:
            return False

        h_thread = kernel32.CreateRemoteThread(
            h_proc,
            None,
            0,
            remote_mem,
            None,
            0,
            None
        )

        if not h_thread:
            return False

        kernel32.WaitForSingleObject(h_thread, 3000)
        success = True

    finally:
        if h_thread:
            kernel32.CloseHandle(h_thread)

        if remote_mem:
            kernel32.VirtualFreeEx(h_proc, remote_mem, 0, MEM_RELEASE)

        kernel32.CloseHandle(h_proc)

    return success


def apply_affinity_local(hwnd: int, affinity: int) -> bool:
    return bool(user32.SetWindowDisplayAffinity(hwnd, affinity))


def set_invisible_obs(hwnd: int, pid: int) -> bool:
    my_pid = kernel32.GetCurrentProcessId()

    if pid == my_pid:
        return (
            apply_affinity_local(hwnd, WDA_EXCLUDEFROMCAPTURE)
            or apply_affinity_local(hwnd, WDA_MONITOR)
        )

    ok = apply_affinity_remote(hwnd, pid, WDA_EXCLUDEFROMCAPTURE)

    if not ok:
        ok = apply_affinity_remote(hwnd, pid, WDA_MONITOR)

    return ok


# ── Barre des tâches via ITaskbarList COM ─────────────────────────────────────

def _get_itaskbarlist():
    """
    Crée une instance ITaskbarList via COM.
    Retourne (p_obj, vtable) ou (None, None) si échec.
    """

    clsid_bytes = bytes([
        0x44, 0xF3, 0xFD, 0x56,
        0x6D, 0xFD,
        0xD0, 0x11,
        0x95, 0x8A, 0x00, 0x60, 0x97, 0xC9, 0xA0, 0x90
    ])

    iid_bytes = bytes([
        0x42, 0xF3, 0xFD, 0x56,
        0x6D, 0xFD,
        0xD0, 0x11,
        0x95, 0x8A, 0x00, 0x60, 0x97, 0xC9, 0xA0, 0x90
    ])

    clsid_c = (ctypes.c_byte * 16)(*clsid_bytes)
    iid_c   = (ctypes.c_byte * 16)(*iid_bytes)

    ole32.CoInitialize(None)

    p_obj = ctypes.c_void_p(0)

    hr = ole32.CoCreateInstance(
        ctypes.byref(clsid_c),
        None,
        1,
        ctypes.byref(iid_c),
        ctypes.byref(p_obj)
    )

    if hr != 0 or not p_obj.value:
        return None, None

    vtable_ptr = ctypes.cast(p_obj, ctypes.POINTER(ctypes.c_void_p))
    vtable = ctypes.cast(vtable_ptr[0], ctypes.POINTER(ctypes.c_void_p))

    HrInit = ctypes.WINFUNCTYPE(ctypes.HRESULT, ctypes.c_void_p)(vtable[3])
    HrInit(p_obj)

    return p_obj, vtable


def remove_from_taskbar(hwnd: int):
    """
    Retire uniquement ce HWND de la barre des tâches.
    """

    p_obj, vtable = _get_itaskbarlist()

    if p_obj and vtable:
        try:
            DeleteTab = ctypes.WINFUNCTYPE(
                ctypes.HRESULT,
                ctypes.c_void_p,
                ctypes.wintypes.HWND
            )(vtable[5])

            hr = DeleteTab(p_obj, hwnd)

            Release = ctypes.WINFUNCTYPE(
                ctypes.c_ulong,
                ctypes.c_void_p
            )(vtable[2])

            Release(p_obj)

            if hr == 0:
                return

        except Exception:
            pass

    ex = user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
    ex |= WS_EX_TOOLWINDOW
    ex &= ~WS_EX_APPWINDOW

    user32.SetWindowLongW(hwnd, GWL_EXSTYLE, ex)

    user32.SetWindowPos(
        hwnd,
        None,
        0,
        0,
        0,
        0,
        ctypes.c_uint(0x0037)
    )


def restore_taskbar(hwnd: int):
    """
    Réajoute le HWND dans la barre des tâches.
    """

    p_obj, vtable = _get_itaskbarlist()

    if p_obj and vtable:
        try:
            AddTab = ctypes.WINFUNCTYPE(
                ctypes.HRESULT,
                ctypes.c_void_p,
                ctypes.wintypes.HWND
            )(vtable[4])

            AddTab(p_obj, hwnd)

            Release = ctypes.WINFUNCTYPE(
                ctypes.c_ulong,
                ctypes.c_void_p
            )(vtable[2])

            Release(p_obj)

        except Exception:
            pass

    ex = user32.GetWindowLongW(hwnd, GWL_EXSTYLE)
    ex &= ~WS_EX_TOOLWINDOW
    ex |= WS_EX_APPWINDOW

    user32.SetWindowLongW(hwnd, GWL_EXSTYLE, ex)

    user32.SetWindowPos(
        hwnd,
        None,
        0,
        0,
        0,
        0,
        ctypes.c_uint(0x0037)
    )


# ── Terminal ──────────────────────────────────────────────────────────────────

def hide_terminal_window():
    try:
        hwnd = kernel32.GetConsoleWindow()

        if hwnd:
            set_invisible_obs(hwnd, kernel32.GetCurrentProcessId())
            remove_from_taskbar(hwnd)
            user32.ShowWindow(hwnd, SW_MINIMIZE)
            print("[Terminal] Fenêtre du terminal masquée et minimisée")

    except Exception as e:
        print(f"[Erreur] Impossible de masquer le terminal: {e}")


def restore_terminal_window():
    try:
        hwnd = kernel32.GetConsoleWindow()

        if hwnd:
            restore_taskbar(hwnd)
            apply_affinity_local(hwnd, WDA_NONE)
            user32.ShowWindow(hwnd, SW_SHOW)
            print("[Terminal] Fenêtre du terminal restaurée")

    except Exception as e:
        print(f"[Erreur] Impossible de restaurer le terminal: {e}")


# ── Faux fix souris ───────────────────────────────────────────────────────────
# Cette classe remplace l'ancien MouseCursorFix.
# Elle ne déplace plus le curseur.
# Donc plus de SetCursorPos(), plus de deuxième curseur.

class DummyMouseFix:
    def start(self):
        pass

    def pause(self):
        pass

    def resume(self):
        pass

    def stop(self):
        pass


# ── Hook clavier F8 / ` / PageUp / PageDown ───────────────────────────────────

class KeyboardScrollHook:
    def __init__(self, hwnd: int, pid: int, title: str, mouse_fix: DummyMouseFix):
        self.hwnd = hwnd
        self.pid = pid
        self.title = title
        self.mouse_fix = mouse_fix

        self._hook = None
        self._active = True
        self._cb_ref = None

        self._console_hwnd = kernel32.GetConsoleWindow()
        self._console_minimized = True

        self._thread = threading.Thread(
            target=self._message_loop,
            daemon=True
        )

    def _send_wheel(self, delta: int):
        rect = get_window_rect(self.hwnd)

        if not rect:
            return

        l, t, r, b = rect

        cx = (l + r) // 2
        cy = (t + b) // 2

        wParam = ctypes.c_uint(((delta & 0xFFFF) << 16)).value
        lParam = ctypes.c_long(
            ((cy & 0xFFFF) << 16) | (cx & 0xFFFF)
        ).value

        user32.PostMessageW(
            self.hwnd,
            WM_MOUSEWHEEL,
            wParam,
            lParam
        )

    def _toggle_target(self):
        if user32.IsIconic(self.hwnd):
            set_invisible_obs(self.hwnd, self.pid)
            remove_from_taskbar(self.hwnd)
            user32.ShowWindow(self.hwnd, SW_RESTORE)
            self.mouse_fix.resume()
            print(f"[F8] '{self.title}' RESTAURÉE")
        else:
            self.mouse_fix.pause()
            user32.ShowWindow(self.hwnd, SW_MINIMIZE)
            print(f"[F8] '{self.title}' MINIMISÉE")

    def _toggle_console(self):
        if not self._console_hwnd:
            return

        my_pid = kernel32.GetCurrentProcessId()

        if self._console_minimized:
            set_invisible_obs(self._console_hwnd, my_pid)
            remove_from_taskbar(self._console_hwnd)
            user32.ShowWindow(self._console_hwnd, SW_RESTORE)
            self._console_minimized = False
            print("[`] Console RESTAURÉE invisible OBS")
        else:
            user32.ShowWindow(self._console_hwnd, SW_MINIMIZE)
            self._console_minimized = True
            print("[`] Console MINIMISÉE")

    def _hook_proc(self, nCode, wParam, lParam):
        if nCode >= 0 and (
            wParam == WM_KEYDOWN
            or wParam == WM_SYSKEYDOWN
        ):
            kb = ctypes.cast(
                lParam,
                ctypes.POINTER(KBDLLHOOKSTRUCT)
            ).contents

            vk = kb.vkCode

            if vk == VK_PRIOR:
                self._send_wheel(WHEEL_DELTA)
                return 1

            elif vk == VK_NEXT:
                self._send_wheel(-WHEEL_DELTA)
                return 1

            elif vk == VK_F8:
                threading.Thread(
                    target=self._toggle_target,
                    daemon=True
                ).start()
                return 1

            elif vk == VK_OEM_3:
                threading.Thread(
                    target=self._toggle_console,
                    daemon=True
                ).start()
                return 1

        return user32.CallNextHookEx(
            self._hook,
            nCode,
            wParam,
            lParam
        )

    def _message_loop(self):
        HOOKPROC = ctypes.WINFUNCTYPE(
            ctypes.c_long,
            ctypes.c_int,
            ctypes.wintypes.WPARAM,
            ctypes.wintypes.LPARAM
        )

        self._cb_ref = HOOKPROC(self._hook_proc)

        self._hook = user32.SetWindowsHookExW(
            WH_KEYBOARD_LL,
            self._cb_ref,
            None,
            0
        )

        if not self._hook:
            print(f"[ERREUR] Hook clavier échoué. Code : {ctypes.get_last_error()}")
            return

        print("[KeyHook] Hook clavier actif — F8 / ` / PageUp / PageDown")

        msg = ctypes.wintypes.MSG()

        while user32.GetMessageW(ctypes.byref(msg), None, 0, 0) != 0:
            user32.TranslateMessage(ctypes.byref(msg))
            user32.DispatchMessageW(ctypes.byref(msg))

    def start(self):
        self._thread.start()

    def pause(self):
        self._active = False

    def resume(self):
        self._active = True

    def stop(self):
        self._active = False

        if self._hook:
            user32.UnhookWindowsHookEx(self._hook)


# ── Orchestration principale ──────────────────────────────────────────────────

def apply_all(hwnd, title, pid):
    print("\n[1/4] Invisibilité OBS...")

    if not set_invisible_obs(hwnd, pid):
        print("      ERREUR — vérifie les droits administrateur.")
        return

    print("      OK")

    print("[2/4] Retrait de la barre des tâches...")
    remove_from_taskbar(hwnd)
    print("      OK")

    print("[3/4] Fix souris désactivé pour éviter le double curseur...")
    mouse_fix = DummyMouseFix()
    print("      OK")

    print("[4/4] Démarrage du hook clavier...")
    key_hook = KeyboardScrollHook(hwnd, pid, title, mouse_fix)
    key_hook.start()
    time.sleep(0.1)
    print("      OK")

    hide_terminal_window()

    print(f"\n{'=' * 60}")
    print(f"  Actif pour : {title}")
    print(f"  PID : {pid}  |  HWND : 0x{hwnd:08X}")
    print("  → F8            : minimise / restaure la fenêtre cible")
    print("  → `             : minimise / restaure la console")
    print("  → OBS           : fenêtre invisible")
    print("  → Taskbar       : fenêtre masquée")
    print("  → Souris        : fix souris désactivé")
    print("  → PageUp/PgDown : scroll la fenêtre cachée")
    print("  → Terminal      : masqué")
    print(f"{'=' * 60}")

    try:
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        print("\n[Arrêt] Restauration en cours...")

        mouse_fix.stop()
        key_hook.stop()

        restore_taskbar(hwnd)

        my_pid = kernel32.GetCurrentProcessId()

        if pid == my_pid:
            apply_affinity_local(hwnd, WDA_NONE)
        else:
            apply_affinity_remote(hwnd, pid, WDA_NONE)

        user32.ShowWindow(hwnd, SW_SHOW)

        restore_terminal_window()

        print("[OK] Tout restauré.")


# ── Sélection interactive ─────────────────────────────────────────────────────

def pick(matches, verb):
    if len(matches) == 1:
        return matches[0]

    print(f"\n{len(matches)} fenêtres correspondent :\n")

    for i, (h, t, p) in enumerate(matches):
        print(f"  [{i}] PID={p}  {t}")

    try:
        i = int(input(f"Numéro à {verb} : ").strip())

        if 0 <= i < len(matches):
            return matches[i]

    except ValueError:
        pass

    print("[ERREUR] Choix invalide.")
    return None


def interactive_mode():
    print("=" * 60)
    print("  OBS Window Hider — version sans double curseur")
    print("  [OBS + taskbar COM + F8 + ` + PgUp/PgDn]")
    print("=" * 60)

    if not is_admin():
        print("\n[!] Pas en mode Administrateur — l'injection peut échouer.\n")

    windows = list_visible_windows()

    if not windows:
        print("[!] Aucune fenêtre visible.")
        return

    print(f"\n{len(windows)} fenêtres visibles :\n")

    for i, (hwnd, title, pid) in enumerate(windows):
        print(f"  [{i:3d}] PID={pid:<6}  {title[:65]}")

    print()

    q = input("Numéro ou partie du titre à cacher : ").strip()

    if q.isdigit():
        idx = int(q)

        if 0 <= idx < len(windows):
            apply_all(*windows[idx])
        else:
            print("[ERREUR] Numéro invalide.")

        return

    matches = [
        (h, t, p)
        for h, t, p in windows
        if q.lower() in t.lower()
    ]

    if not matches:
        print(f"[!] Rien trouvé pour '{q}'.")
        return

    r = pick(matches, "cacher")

    if r:
        apply_all(*r)


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser()

    ap.add_argument("window_name", nargs="?")
    ap.add_argument("--list", "-l", action="store_true")

    args = ap.parse_args()

    if args.list:
        for hwnd, title, pid in list_visible_windows():
            print(f"  [0x{hwnd:08X}] PID={pid:<6}  {title}")

        return

    if args.window_name:
        matches = find_window(args.window_name)

        if not matches:
            print(f"[!] Rien trouvé pour '{args.window_name}'.")

        else:
            r = pick(matches, "cacher")

            if r:
                apply_all(*r)

        return

    interactive_mode()


if __name__ == "__main__":
    main()