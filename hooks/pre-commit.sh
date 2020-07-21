 If there are whitespace errors, print the offending file names and fail.
exec git diff-index --check --cached $against --

# pre-commit.sh
STASH_NAME="pre-commit-$(date +%s)"
git stash save -q --keep-index $STASH_NAME

# Test prospective commit
STASHES=$(git stash list)
if [[ $STASHES == "$STASH_NAME" ]];
then
  git stash pop -q
fi

git stash -q --keep-index
./run_tests.sh
RESULT=$?
git stash pop -q
[ $RESULT -ne 0 ] && exit 1
exit 0