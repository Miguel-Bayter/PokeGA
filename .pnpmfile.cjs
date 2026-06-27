module.exports = {
  hooks: {
    readPackage(pkg) {
      // Allow build scripts for specific packages
      const allowedPackages = [
        '@parcel/watcher',
        '@prisma/engines',
        '@swc/core',
        'esbuild',
        'prisma',
        'sharp',
        'unrs-resolver'
      ];
      
      if (allowedPackages.includes(pkg.name)) {
        pkg.scripts = pkg.scripts || {};
      }
      
      return pkg;
    }
  }
};
