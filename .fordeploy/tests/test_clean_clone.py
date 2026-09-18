import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest

LAUNCHER = Path(__file__).parents[1] / "deploy-aws.sh"


class CleanCloneTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.source = self.root / "source"
        self.source.mkdir()
        self.git("init", "-b", "main", str(self.source))
        (self.source / "application.txt").write_text("committed")
        self.git("-C", str(self.source), "add", ".")
        self.git("-C", str(self.source), "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "fixture")
        self.launch = self.root / "launcher"
        scripts = self.launch / ".fordeploy"
        scripts.mkdir(parents=True)
        shutil.copy2(LAUNCHER, scripts / LAUNCHER.name)
        (scripts / "configure-aws-alb.sh").write_text(":\n")
        for name in ("Dockerfile.aws", ".dockerignore"):
            (self.launch / name).write_text("launcher fixture")
        self.build = self.root / "deploy-remote-repo"
        self.build.mkdir()
        (self.build / "sibling").mkdir()
        (self.build / "sibling" / "keep").write_text("keep")
        self.checkout = self.build / "global-ai-pricing"
        self.calls = self.root / "calls"
        mocks = self.root / "bin"
        mocks.mkdir()
        for name, body in (
            ("docker", 'if [ "$1" = build ]; then printf "%s\\n" "${@: -1}" >> "$TEST_CALLS"; fi'),
            ("ssh", 'cat >/dev/null'),
            ("scp", ':'),
        ):
            command = mocks / name
            command.write_text("#!/usr/bin/env bash\n" + body + "\n")
            command.chmod(0o755)
        key = self.root / "fixture-key"
        key.touch()
        self.env = dict(os.environ, PATH=str(mocks) + ":" + os.environ["PATH"],
                        BASTION_SSH_KEY=str(key), CONFIGURE_ALB="0", PRICING_BUILD_ROOT=str(self.build),
                        PRICING_DEPLOY_REPO_URL=str(self.source), PRICING_DEPLOY_REF="main",
                        REMOTE_BASE_DIR="/home/ubuntu/global-ai-pricing/docker_images",
                        TEST_CALLS=str(self.calls))

    def git(self, *args):
        return subprocess.run(["git", *args], check=True, capture_output=True, text=True)

    def run_launcher(self, launcher=None):
        return subprocess.run(["bash", str(launcher or self.launch / ".fordeploy" / LAUNCHER.name)],
                              env=self.env, input="", capture_output=True, text=True)

    def test_fresh_clone_reuses_deploy_and_supports_launch_inside_clone(self):
        first = self.run_launcher()
        self.assertEqual(first.returncode, 0, first.stderr)
        (self.checkout / "untracked.txt").touch()
        (self.checkout / "application.txt").write_text("dirty")
        second = self.run_launcher(self.checkout / ".fordeploy" / LAUNCHER.name)
        self.assertEqual(second.returncode, 0, second.stderr)
        self.assertFalse((self.checkout / "untracked.txt").exists())
        self.assertEqual((self.checkout / "application.txt").read_text(), "committed")
        self.assertTrue((self.build / "sibling" / "keep").exists())
        self.assertEqual(self.calls.read_text().splitlines(), [str(self.checkout)] * 2)
        self.assertEqual((self.checkout / "Dockerfile.aws").read_text(), "launcher fixture")
        self.assertEqual((self.checkout / ".fordeploy/source-commit.txt").read_text().strip(),
                         self.git("-C", str(self.source), "rev-parse", "HEAD").stdout.strip())

    def test_symlink_checkout_is_rejected(self):
        self.checkout.symlink_to(self.source, target_is_directory=True)
        result = self.run_launcher()
        self.assertNotEqual(result.returncode, 0)
        self.assertTrue((self.source / "application.txt").exists())
        self.assertFalse(self.calls.exists())

    def test_invalid_parent_is_rejected_before_creation(self):
        invalid = self.root / "invalid-parent"
        self.env["PRICING_BUILD_ROOT"] = str(invalid)
        self.assertNotEqual(self.run_launcher().returncode, 0)
        self.assertFalse(invalid.exists())

    def test_clone_failure_does_not_deploy(self):
        self.env["PRICING_DEPLOY_REF"] = "missing-branch"
        self.assertNotEqual(self.run_launcher().returncode, 0)
        self.assertFalse(self.calls.exists())
        self.assertTrue((self.build / "sibling" / "keep").exists())

    def test_build_lock_prevents_checkout_replacement(self):
        import fcntl
        self.checkout.mkdir()
        marker = self.checkout / "keep"
        marker.touch()
        with (self.build / ".global-ai-pricing-build.lock").open("w") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            self.assertNotEqual(self.run_launcher().returncode, 0)
        self.assertTrue(marker.exists())
        self.assertFalse(self.calls.exists())

    def test_shell_syntax(self):
        subprocess.run(["bash", "-n", str(LAUNCHER)], check=True)
