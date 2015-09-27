# EC2/Teamcity/Docker configuration

## Features:

* Builds an EC2 host that will run Teamcity in Docker containers
* Runs 3 Teamcity agents
* An ELB handles SSL termination
* DNS names are created for the Teamcity server, and for ssh to the EC2

## Usage:

Prequisites:

* The AWS configuration requires an account in the cloudservice-aws-dev IAM (but could in principle be used in any IAM with changes where appropriate).
* [Ansible](http://www.ansible.com/) needs to be installed on your client machine (but if you previously used [fxa-dev](https://github.com/mozilla/fxa-dev), you already have that set up.
* You will also need to add an SSH key in the IAM for the region you will be using (but again, if you used fxa-dev, you already have (at least) one already). (Although note: keys from [identity-pubkeys](https://github.com/mozilla/identity-pubkeys) will be installed on the EC2 host for team access).
* Create a file in `./env` like so, with a filename of *"yourboxname.yml"*:
```yaml
---
keyname: yourkeyname
region_name: us-west-1
```
* Currently, the Docker image is installed from a private [Quay.io](https://quay.io/) repository, so you'll need to get access tokens from [jrgm](https://github.com/jrgm/).
* To build the AWS Cloudformation stack run:
```sh
  QUAY_IO_DEPLOY_KEY="anothersecretkey" make yourboxname
```
* After Ansible completes, you can ssh to the box with `ssh ec2-user@meta-tc-yourboxname`, and go to the server at `https://tc-yourboxname.dev.lcip.org`.
* Now the fun starts:
  * At `https://tc-yourboxname.dev.lcip.org`, click `Proceed`.
  * Choose `Internal (HSQLDB)`, and click `Proceed`.
  * Now accept the license agreement, and create and adminstrator account in the next dialog.
  * Congratulations, you now have an Teamcity server with one agent waiting to be authorized. Now click on Projects in the top right, and then Create Project. After that create a Build Configuration; skip past setting up a VCS Root at the next screen. Now, under Build Steps, add a build step of Command Line, and enter what you need. Look at other "tc-tests*.dev.lcip.org" servers for examples, or make up your own.
  * Now, in the top menu bar, click Agents, and then on the Unauthorized tab. There you will find your agent waiting to be authorized, so do so.
  * To create two more agents, ssh to your box, and do `cd ~/teamcity; fig -f production.yml scale agent=3`. The agents will take a moment to start and configure themselves, but you will eventually see them in the Unauthorized tab waiting to be authorized.

Todo/Bugs:
* work out if can do websockets with ELB and Teamcity; just ignore the warning in the UI, it works without websockets.
* install Fx18 as part of the agent Dockerfile setup scripts.
* work out how to import existing configuration and/or start with a minimal amount of configuration already in place. (I've done this on tc-tests2.dev.lcip.org, but had to hack the import file to get around errors on mismatched data versions. Teamcity upgrade in general seems excessively hard/strict on small version deltas).
* change `../../../tests/teamcity/run.sh` to run `../../../tests/teamcity/update-builds.sh`, which will ensure agents are up-to-date inside each agent container.
* Work out how to have VNC remote sessions available, to be able to see the agent desktop for debugging.
* Other types of agents (e.g. Ubuntu)
* You tell [me](https://github.com/jrgm)

## Thanks

[Ariya Hidyat](http://ariya.ofilabs.com/about) for [this article](http://ariya.ofilabs.com/2015/03/continuous-integration-for-node-js-projects-with-teamcity.html). This code extends that work to have multiple Teamcity agents, and adds AWS Cloudformation EC2 and ELB setup and deployment.
