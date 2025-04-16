#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PhotoGalleryStack } from '../lib/photo-gallery-stack';

const app = new cdk.App();
new PhotoGalleryStack(app, 'PhotoGalleryStack');
