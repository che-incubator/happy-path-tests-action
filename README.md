[![codecov](https://img.shields.io/codecov/c/github/che-incubator/happy-path-tests-action)](https://codecov.io/gh/che-incubator/happy-path-tests-action)

# Eclipse Che - Happy Path Tests Action

This Github action will run Happy Path tests of Eclipse Che

## pre-requisites:

- running Eclipse Che instance
- tested on ubuntu 20.04

## how it works:

**NOTE**: Happy Path Tests action will pre-fetch all images referenced by the devfile URL before starting the workspace.
To avoid to try to fetch images that may only be present locally (and then throwing errors), please name these images with prefix `local-`.
For example let say you build a custom Che-Theia, name the custom image `local-che-theia` and populate local OCI registry available by using `$(minikube docker-env)` environment variables.

# Usage

```yaml
# Install che
name: che

# Trigger the workflow on push or pull request
on: [push, pull_request]

jobs:
  install:
    runs-on: ubuntu-20.04
    steps:
      - name: Run Happy Paths Tests of Eclipse Che
        id: run-happy-path-tests
        uses: che-incubator/happy-path-tests-action@next
          with:
            che-url: ${{ steps.deploy-che.outputs.che-url }}

```

Development version is available with `@next`. At each commit in main branch, a new development release is pushed to `next` branch.

# Configuration / input

```yaml
steps:
  - name: Run Happy Paths Tests of Eclipse Che
    id: run-happy-path-tests
    uses: che-incubator/happy-path-tests-action@next
      with:
        che-url: ${{ steps.deploy-che.outputs.che-url }}
        <Use a parameter from the list below>: <specify here the value>
```

## che-url

Mnadatory: URL of the running Eclipse-Che instance

## devfile-url

Optional: path or URL to a devfile to use instead of the default devfile.yaml

# Output

This action will set outputs to the current step

## workspace-url

URL of the workspace that has been created by Happy Path Tests
