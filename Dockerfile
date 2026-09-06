# Development image. Everything npm does — installing packages, running their
# lifecycle scripts, executing tests — happens in here, never on the host.
#
# Debian slim rather than Alpine: esbuild and rolldown ship prebuilt binaries
# per libc, and glibc is the better-trodden path. The image is larger; the
# failure modes are fewer.
FROM node:24-slim

# The official image ships an unprivileged `node` user. Use it: a container
# that installs arbitrary packages should not be running them as root.
WORKDIR /app
RUN chown node:node /app
USER node

# Dependencies first, so editing source does not invalidate the install layer.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci

COPY --chown=node:node . .

CMD ["npm", "test"]
