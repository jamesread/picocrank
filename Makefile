.PHONY: default build build-minimal build-pages lint lint-fix test dev

default: build

node_modules: package.json package-lock.json
	npm ci
	touch node_modules

build: node_modules
	npm run build

build-minimal: node_modules
	npm run build:minimal

build-pages: node_modules
	npm run build:pages

lint: node_modules
	npm run lint

lint-fix: node_modules
	npm run lint:fix

test: node_modules
	npm test

dev: node_modules
	npm run dev
