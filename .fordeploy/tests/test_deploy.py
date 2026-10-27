import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = (Path(__file__).parents[1] / "deploy-aws.sh").read_text()
PRIVATE = SCRIPT.split("bash -s <<'PRIVATE_SCRIPT'\n", 1)[1].split("\nPRIVATE_SCRIPT", 1)[0]
BASTION = SCRIPT.split("bash -s <<'BASTION_SCRIPT'\n", 1)[1].split("\nBASTION_SCRIPT", 1)[0]


class DeploymentTests(unittest.TestCase):
    def run_private(self, failure=""):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            for name in ("env", "key", "image.tar"):
                (root / name).touch()
            log = root / "calls"
            sudo = root / "sudo"
            sudo.write_text("""#!/usr/bin/env bash
shift
printf '%s\\n' "$*" >> "$CALLS"
case "$*" in
  'load -i '*) [ "$FAILURE" != load ] ;;
  'ps --filter '*status=running*) echo pricingai ;;
  'ps -a --format '*) printf '%s\\n' 'old pricingai-old global-ai-pricing:old exited' 'live pricingai-live global-ai-pricing:live running' 'foreign pricingai-foreign another:old exited' 'other other global-ai-pricing:old exited' ;;
  'image inspect '*) case "${@: -1}" in *:current|*:alias) echo sha-current ;; *:used) echo sha-used ;; *) echo sha-old ;; esac ;;
  'image ls --format '*) printf '%s\\n' global-ai-pricing:current global-ai-pricing:alias global-ai-pricing:old global-ai-pricing:used another:old ;;
  'image ls --no-trunc '*) printf '%s\\n' sha-dangling sha-used sha-current ;;
  'ps -aq --filter ancestor=sha-used') echo referenced ;;
  *) exit 0 ;;
esac
""")
            for name, body in (("curl", '[ "$FAILURE" != health ]'), ("sleep", ':' )):
                f = root / name
                f.write_text("#!/usr/bin/env bash\n" + body + "\n")
                f.chmod(0o755)
            sudo.chmod(0o755)
            env = dict(os.environ, PATH=tmp + ":" + os.environ["PATH"],
                       CALLS=str(log), FAILURE=failure, REMOTE_BASE_DIR=tmp,
                       PRIVATE_TAR=str(root / "image.tar"), APP_DIR_ON_PRIVATE=tmp,
                       ENV_FILE_ON_PRIVATE=str(root / "env"), GCP_KEY_ON_PRIVATE=str(root / "key"),
                       DATA_DIR_ON_PRIVATE=tmp, IMAGE="global-ai-pricing:current",
                       CONTAINER_NAME="pricingai", HOST_PORT="3400", CONTAINER_PORT="3000",
                       DATABASE_URL="file:/app/data/test.db", HEALTH_CHECK_PATH="/ko/pricing")
            result = subprocess.run(["bash", "-c", PRIVATE], env=env, capture_output=True, text=True)
            self.assertFalse((root / "image.tar").exists())
            return result, log.read_text().splitlines()

    def test_healthy_cleanup_is_scoped(self):
        result, calls = self.run_private()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual([c for c in calls if c.startswith("image rm ")],
                         ["image rm global-ai-pricing:old", "image rm sha-dangling"])
        self.assertEqual([c for c in calls if c.startswith("rm ")], ["rm -f pricingai", "rm old"])
        self.assertFalse(any("prune" in c for c in calls))

    def test_failed_health_keeps_old_resources(self):
        result, calls = self.run_private("health")
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(any(c.startswith("image rm ") or c == "rm old" for c in calls))

    def test_failed_load_keeps_existing_container_and_removes_tar(self):
        result, calls = self.run_private("load")
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(any(c.startswith("rm ") or c.startswith("run ") for c in calls))

    def test_shell_syntax(self):
        for script in (SCRIPT, PRIVATE, BASTION):
            result = subprocess.run(["bash", "-n"], input=script, text=True, capture_output=True)
            self.assertEqual(result.returncode, 0, result.stderr)

    def test_bastion_command_only_ssh_detaches_stdin(self):
        self.assertIn(
            'ssh -n -i ~/.ssh/penvotkeypair1.pem -o StrictHostKeyChecking=accept-new "$PRIVATE_HOST" \\\n'
            '  "mkdir -p -- \'$REMOTE_BASE_DIR\'"',
            BASTION,
        )
        self.assertIn(
            'ssh -n -i ~/.ssh/penvotkeypair1.pem -o ConnectTimeout=10 '
            '-o StrictHostKeyChecking=accept-new "$PRIVATE_HOST"',
            BASTION,
        )
