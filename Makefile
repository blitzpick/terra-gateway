#
# Vars
#

BIN = ./node_modules/.bin
.DEFAULT_GOAL := all

#
# Tasks
#

test:
	@node test/*.js

validate:
	@standard

all: validate test

init:
	@git init
	@git add .
	@git commit -am "FIRST"
	@hub create joshrtay/terra-gateway -d "Create terraform_api_gateway configs from a simple spec."
	@travis enable
	@git push -u origin master

#
# Phony
#

.PHONY: test validate all init
