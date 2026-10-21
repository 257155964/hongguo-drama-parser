# -*- coding: utf-8 -*-
"""自动重试发布：网络恢复即重跑 _publish.py，直到成功"""
import os, subprocess, sys, time, urllib.request

ROOT = r"C:\Users\zly25\Doubao\chats\2026-10-08\new-chat\红果短剧解析工具"
RESULT = os.path.join(ROOT, "_publish_result.txt")
log = os.path.join(ROOT, "_publish_retry_log.txt")

def net_ok():
    try:
        with urllib.request.urlopen("https://api.github.com", timeout=10) as r:
            return r.status == 200
    except Exception:
        return False

def main():
    msgs = []
    max_tries = 15
    for i in range(max_tries):
        if not net_ok():
            msgs.append("[%d] 网络不通，等待60s" % i)
            time.sleep(60)
            continue
        msgs.append("[%d] 网络通，执行发布" % i)
        p = subprocess.run([sys.executable, os.path.join(ROOT, "_publish.py")], capture_output=True, text=True, timeout=600)
        msgs.append("    exit=" + str(p.returncode))
        if os.path.exists(RESULT):
            with open(RESULT, encoding="utf-8") as f:
                content = f.read()
            msgs.append("    " + content.replace("\n", " | "))
            if "上传完成" in content:
                msgs.append("DONE")
                break
        time.sleep(30)
    with open(log, "w", encoding="utf-8") as f:
        f.write("\n".join(msgs))

if __name__ == "__main__":
    main()
