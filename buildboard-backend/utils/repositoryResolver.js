const User = require('../models/User');
const Organization = require('../models/Organization');
const Repository = require('../models/Repository');

const defaultPopulate = [
  { path: 'owner', select: 'username name avatar' },
  { path: 'organization', select: 'slug name avatar' },
];

/**
 * Resolve a repository by URL owner segment (username or org slug) and repo slug.
 * Slug alone is not unique across users; owner + slug is required.
 */
async function findRepositoryByOwnerSlug(ownerParam, repoSlug, populate = defaultPopulate) {
  if (!ownerParam || !repoSlug) return null;

  const ownerUser = await User.findOne({ username: ownerParam });
  if (ownerUser) {
    let query = Repository.findOne({ slug: repoSlug, owner: ownerUser._id });
    if (populate?.length) query = query.populate(populate);
    return query;
  }

  const org = await Organization.findOne({ slug: ownerParam });
  if (org) {
    let query = Repository.findOne({ slug: repoSlug, organization: org._id });
    if (populate?.length) query = query.populate(populate);
    return query;
  }

  return null;
}

module.exports = { findRepositoryByOwnerSlug, defaultPopulate };
