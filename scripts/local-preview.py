"""Run only this project's production preview; private file control manages its child."""
from pathlib import Path
import os, shutil, subprocess, time

ROOT=Path(__file__).resolve().parents[1]
CONTROL=ROOT/'.preview-control'
CONTROL.write_text('run')
environment=os.environ.copy()
environment.update(FRONTEND_ORIGIN='http://poblancer.local:3103',NEXT_TELEMETRY_DISABLED='1')
command=[shutil.which('node'),str(ROOT/'node_modules/next/dist/bin/next'),'start','--hostname','127.0.0.1','--port','3103']
def start():
    return subprocess.Popen(command,cwd=ROOT,env=environment)
def stop(process):
    if process.poll() is None:
        process.terminate()
        try:process.wait(timeout=15)
        except subprocess.TimeoutExpired:process.kill();process.wait()
process=start()
try:
    while process.poll() is None:
        time.sleep(1)
        request=CONTROL.read_text().strip()
        if request=='stop':break
        if request=='restart':
            CONTROL.write_text('run');stop(process);process=start()
finally:
    stop(process)
