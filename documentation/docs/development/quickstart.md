# Development Getting Started

## Introduction

The following describes the steps involved to initialize a CDF development environment from scratch, to build, run and test the project, then finally on how to commit modifications to the source code.

Due to the scripts used as part of both the build and deployment steps, only linux type environments (including macOS) are supported.

## Configuring the development environment

The following is a one-time setup to configure the CDF development environment:

+ ensure you have a [git client](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) installed
+ install [Node Version Manager](https://github.com/creationix/nvm#install--update-script):

```sh
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
```

+ using nvm installed from the previous step, install Node.js v8.10:

```sh
> nvm use v8.10
```

+ install [`pnpm`](https://pnpm.js.org) package manager:

```sh
> npm install -g pnpm
```

+ clone the project:

```sh
> git clone https://git-codecommit.us-west-2.amazonaws.com/v1/repos/cdf-core
```

+ initialize the project dependencies:

```sh
> cd cdf-core
cdf-core> pnpm install
```

## Building the modules

To build all the modules:

```sh
cdf-core> pnpm recursive run build
```

To build a specific modules (e.g. the Asset Library)

```sh
cdf-core> cd packages/services/assetlibrary
cdf-core/packages/services/assetlibrary> pnpm run build
```

## Testing the modules

To run unit tests for all the modules:

```sh
cdf-core> pnpm recursive run test
```

To run unit tests for a specific modules (e.g. the Asset Library)

```sh
cdf-core> cd packages/services/assetlibrary
cdf-core/packages/services/assetlibrary> pnpm run test
```

Note that integration tests are automatically run by the CI/CD pipeline upon each commit to the `master` branch.


## Running the modules

To start all the runnable services:

```sh
cdf-core> pnpm recursive run start
```

To start a specific runnable service e.g. the Asset Library)

```sh
cdf-core> cd packages/services/assetlibrary
cdf-core/packages/services/assetlibrary> pnpm run start
```

## Making changes

We adhere to what is known as a [GitHub flow](https://guides.github.com/introduction/flow/) as far as our approach to branching is concerned.  Basically this boils down to:

+ The `master` branch represents a working version of the code that may be deployed to a production environment
+ Under no circumstances never commit directly to `master`!
+ When starting a new feature or fixing a bug, create a new branch from `master`:

```sh
cdf-core> git checkout -b my-branch

Switched to a new branch 'my-branch'
```

+ At suitable points, commit your work by running the following, and following the prompts to describe your commit:

```sh
cdf-core> git add -A
cdf-core> pnpm run commit
```

+ When you finished your implementation, and ensured that all existing tests run as well as adding any new tests, push your branch to the CodeCommit repo:

```sh
cdf-core> git push my-branch
```

+ Create a [CodeCommit Pull Request](https://docs.aws.amazon.com/codecommit/latest/userguide/how-to-create-pull-request.html) to have your work reviewed by peers.  Once created, send out the pull request link to other team members

+ Once your pull request has been reviewed, and any issues addressed, merge your implementation back into the main code branch.  **Note: don't use the CodeCommit console to perform the merge!**.  Instead, merge using the `git` command as follows:

```sh
# first ensure your have the latest version of `master`
cdf-core> git checkout master
cdf-core> git pull

# next, merge your branch into your local master
cdf-core> git merge --no-ff my-branch

# address any conflicts if reported

# re-run tests to make sure everything is still ok
cdf-core> pnpm recursive run test

# if tests still pass, delete your local branch, and push the changes
cdf-core> git branch -d my-branch
cdf-core> git push origin master
```

## FAQ

???+ question "Why do I have to use `pnpm run commit` to commit my work instead of the usual `git commit`?"

    `pnpm run commit` is configured to run the [commitizen command line utility](https://github.com/commitizen/cz-cli) which forces you to describe commits using a specific format.  This is vitally important, as there are steps in our CI/CD pipeline that analyze all git commits since the last release, use these specially formatted messages to intelligently increment the version numbers (e.g. understand if there's a breaking change), and finally auto generates a change log for the release.

???+ question "Why should I manually merge using `git` instead of closing a pull request directly in the CodeCommit console?"

    When closing a pull request in the CodeCommit console, it performs a `fast-forward` merge.  What this means is that when you view the history of commits in CodeCommit or any other similar tool, all the commit messages you made in your branch appear as if they were made directly to master.

    Alternatively, by performing the git merge manually using the `--no-ff` argument, it creates a commit message for the merge itself.  What this means is that when you view the history, even though you have merged your branch into your master, all your commit messages for your branch will be grouped together making it easy to see what commits were originally made to your branch.

    Performing a `no fast forard` type merge makes future troubleshooting so much easier.

???+ question "Why are we using node.js v8 when there are more recent versions available?"
    The latest node.js version that AWS Lambda supports is v8.10, and AWS Lambda is one of our supported deployment targets.

???+ question "What is the need for using ([`pnpm`](https://pnpm.js.org) package manager)?  What's wrong with `npm`?"
    The `cdf-core` git repo is what is known as a monorepo, a large single repository that contains many different projects.

    The decision to migrate CDF to a monorepo was made to:

    + simplify the development environment by removing the need for an npm private repo (verdaccio)
    + simplify the dependency management across projects (reduced the development environment footprint from >6GB to 300MB)
    + allow for atomic commits spanning multiple projects, simplyifing branching, merging and code reviews

    `pnmp` has features that allow us to efficiently work with monorepos, while still being able to bundle individual services in the way required by AWS Lambda.

???+ question "I use the [fish shell](https://fishshell.com) on macOS (installed via homebrew) instead of the default shell.  How do I configure `nvm`?"

    Add the following to `cat ~/.config/fish/config.fish`, then open a new terminal:

    ```sh
    function nvm
       bass source (brew --prefix nvm)/nvm.sh --no-use ';' nvm $argv
    end
    set -x NVM_DIR ~/.nvm
    nvm use default --silent
    ```